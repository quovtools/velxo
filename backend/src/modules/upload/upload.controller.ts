import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
  Logger,
  Query,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { StorageService } from './storage.service'
import { SupabaseJwtGuard } from '@/common/guards/jwt.guard'
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

// Valid upload folders
const VALID_FOLDERS = new Set(['listings', 'avatars', 'gigs', 'slides', 'banners', 'misc', 'kyc', 'messages'])

/**
 * POST /upload?folder=listings   → upload a file (auth required), returns { key, url }
 * POST /upload?folder=kyc        → upload a KYC doc (auth required)
 * POST /upload?folder=avatars    → upload a profile avatar (auth required)
 * POST /upload?folder=gigs       → upload a gig image (auth required)
 *
 * Cloudinary is public — all assets get a permanent HTTPS URL.
 * No presigned URLs or signing endpoints needed.
 */
@Controller('upload')
export class UploadController {
  private readonly logger = new Logger(UploadController.name)

  constructor(private storage: StorageService) {}

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

    if (!VALID_FOLDERS.has(safeFolder)) {
      throw new BadRequestException(`Unknown folder: ${safeFolder}`)
    }

    const ext = (file.originalname.split('.').pop() || 'jpg')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 5) || 'jpg'

    const random = Math.random().toString(36).slice(2, 10)
    const key = `${safeFolder}/${Date.now()}-${random}.${ext}`

    try {
      const url = await this.storage.upload(file.buffer, key, file.mimetype)
      this.logger.log(`Uploaded by ${userId}: ${key}`)
      return ApiResponseDto.ok({ key, url }, 'File uploaded successfully')
    } catch (err: any) {
      this.logger.error(`Cloudinary upload failed for user ${userId}:`, err?.message || err)
      throw new BadRequestException('Upload failed — please try again')
    }
  }
}
