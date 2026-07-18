import {
  Controller,
  Post,
  Get,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  Query,
  Logger,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { StorageService } from './storage.service'
import { SupabaseJwtGuard } from '@/common/guards/supabase-jwt.guard'
import { ApiResponseDto } from '@/common/dto/api-response.dto'
import { CurrentUserId } from '@/common/decorators/current-user.decorator'

// Allowed MIME types
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
])

// 8 MB max per file
const MAX_SIZE = 8 * 1024 * 1024

// Folders whose keys may be signed without authentication (public-facing images)
const PUBLIC_FOLDERS = new Set(['listings', 'avatars', 'gigs', 'slides', 'misc'])

// KYC folder — signing requires authentication (handled by guard at the route level)
const PRIVATE_FOLDERS = new Set(['kyc'])

/**
 * POST /upload?folder=listings   → upload a file (auth required), returns { key, url }
 * POST /upload?folder=kyc        → upload a KYC doc (auth required)
 * POST /upload?folder=avatars    → upload a profile avatar (auth required)
 * POST /upload?folder=gigs       → upload a gig image (auth required)
 *
 * GET  /upload/sign?key=...            → get a fresh presigned URL (NO auth — public images)
 * GET  /upload/sign/private?key=...    → get a fresh presigned URL (auth required — KYC docs)
 *
 * Bucket is PRIVATE on B2.
 * Public-folder presigned URLs are long-lived (B2_URL_TTL_SECONDS, default 24 h) so
 * visitors can see listing/avatar images without logging in.
 * KYC presigned URLs are short-lived (1 h) and require a valid JWT.
 */
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name)

  constructor(private storage: StorageService) {}

  // ─── Upload (always requires auth) ─────────────────────────────────────────

  @Post()
  @UseGuards(SupabaseJwtGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.has(file.mimetype)) {
          cb(null, true)
        } else {
          cb(new BadRequestException(`File type ${file.mimetype} is not allowed`), false)
        }
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string = 'misc',
    @CurrentUserId() userId: string,
  ) {
    if (!file) throw new BadRequestException('No file provided')

    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32) || 'misc'

    const ext = (file.originalname.split('.').pop() || 'jpg')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 5) || 'jpg'

    const random = Math.random().toString(36).slice(2, 10)
    const key = `${safeFolder}/${Date.now()}-${random}.${ext}`

    // KYC docs: short-lived URL. Public images: long-lived URL.
    const isPrivate = PRIVATE_FOLDERS.has(safeFolder)
    const ttl = isPrivate ? 3600 : (parseInt(process.env.B2_URL_TTL_SECONDS || '86400', 10))

    try {
      await this.storage.upload(file.buffer, key, file.mimetype)
      const url = await this.storage.getPresignedUrl(key, ttl)
      this.logger.log(`Uploaded by ${userId}: ${key} (ttl=${ttl}s, private=${isPrivate})`)
      return ApiResponseDto.ok({ key, url }, 'File uploaded successfully')
    } catch (err: any) {
      this.logger.error(`B2 upload failed for user ${userId}:`, err?.message || err)
      throw new BadRequestException('Upload failed — please try again')
    }
  }

  // ─── Sign public images (no auth — visitors can call this) ─────────────────

  /**
   * Returns a fresh presigned URL for public-folder keys (listings, avatars, gigs, slides).
   * No authentication required — visitors need this to view images on the site.
   * KYC keys are rejected here; use /upload/sign/private for those.
   *
   * GET /upload/sign?key=listings/abc123.jpg
   */
  @Get('sign')
  async signPublicUrl(@Query('key') key: string) {
    if (!key?.trim()) throw new BadRequestException('key query param is required')

    // Extract folder from key (first path segment)
    const folder = key.split('/')[0]

    if (PRIVATE_FOLDERS.has(folder)) {
      throw new ForbiddenException('KYC documents require authentication — use /upload/sign/private')
    }

    if (!PUBLIC_FOLDERS.has(folder)) {
      throw new BadRequestException(`Unknown folder: ${folder}`)
    }

    try {
      const ttl = parseInt(process.env.B2_URL_TTL_SECONDS || '86400', 10)
      const url = await this.storage.getPresignedUrl(key, ttl)
      return ApiResponseDto.ok({ key, url }, 'Signed URL generated')
    } catch (err: any) {
      this.logger.error(`Public presign failed for key ${key}:`, err?.message || err)
      throw new BadRequestException('Could not generate signed URL')
    }
  }

  // ─── Sign private KYC images (auth required) ────────────────────────────────

  /**
   * Returns a short-lived presigned URL for KYC document keys.
   * Requires a valid JWT — only the seller or admin should call this.
   *
   * GET /upload/sign/private?key=kyc/abc123.jpg
   */
  @Get('sign/private')
  @UseGuards(SupabaseJwtGuard)
  async signPrivateUrl(@Query('key') key: string) {
    if (!key?.trim()) throw new BadRequestException('key query param is required')

    const folder = key.split('/')[0]

    if (!PRIVATE_FOLDERS.has(folder)) {
      throw new BadRequestException(`Use /upload/sign for public folder: ${folder}`)
    }

    try {
      const url = await this.storage.getPresignedUrl(key, 3600) // 1 hour for KYC
      return ApiResponseDto.ok({ key, url }, 'Signed URL generated')
    } catch (err: any) {
      this.logger.error(`Private presign failed for key ${key}:`, err?.message || err)
      throw new BadRequestException('Could not generate signed URL')
    }
  }
}
