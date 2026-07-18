import { Injectable, Logger } from '@nestjs/common'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * StorageService — uploads files to Backblaze B2 via the S3-compatible API.
 * Bucket is PRIVATE — all reads use presigned URLs (default 1-hour expiry).
 *
 * Required environment variables:
 *   B2_ENDPOINT      e.g. https://s3.us-east-005.backblazeb2.com
 *   B2_REGION        e.g. us-east-005
 *   B2_BUCKET        e.g. velxo-assets
 *   B2_KEY_ID        your B2 applicationKeyId
 *   B2_APP_KEY       your B2 applicationKey
 *
 * Optional:
 *   B2_URL_TTL_SECONDS  how long presigned URLs stay valid (default: 3600 = 1 h)
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly client: S3Client
  private readonly bucket: string
  private readonly urlTtl: number

  constructor() {
    const endpoint = process.env.B2_ENDPOINT
    const region = process.env.B2_REGION || 'us-east-005'
    const bucket = process.env.B2_BUCKET
    const keyId = process.env.B2_KEY_ID
    const appKey = process.env.B2_APP_KEY

    if (!endpoint || !bucket || !keyId || !appKey) {
      this.logger.warn(
        'B2 storage not fully configured — uploads will fail. ' +
          'Set B2_ENDPOINT, B2_REGION, B2_BUCKET, B2_KEY_ID, B2_APP_KEY.',
      )
    }

    this.bucket = bucket || ''
    this.urlTtl = parseInt(process.env.B2_URL_TTL_SECONDS || '3600', 10)

    this.client = new S3Client({
      endpoint: endpoint || '',
      region,
      credentials: {
        accessKeyId: keyId || '',
        secretAccessKey: appKey || '',
      },
      // B2 requires path-style URLs (not virtual-hosted)
      forcePathStyle: true,
    })
  }

  /**
   * Upload a buffer to B2 (private bucket — no ACL header).
   * Returns the object key, NOT a public URL.
   * Use getPresignedUrl() to generate a readable link.
   *
   * @param buffer   File contents
   * @param key      Object key inside the bucket, e.g. "listings/abc123.jpg"
   * @param mimeType e.g. "image/jpeg"
   */
  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    this.logger.log(`Uploading ${key} (${mimeType}) to private B2 bucket ${this.bucket}`)

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // No ACL — bucket is private
      }),
    )

    this.logger.log(`Uploaded → key: ${key}`)
    return key
  }

  /**
   * Generate a presigned GET URL for a private object.
   * The URL is valid for `ttlSeconds` seconds (default: B2_URL_TTL_SECONDS or 3600).
   */
  async getPresignedUrl(key: string, ttlSeconds?: number): Promise<string> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: ttlSeconds ?? this.urlTtl },
    )
    return url
  }

  /**
   * Delete an object from B2 by its key.
   */
  async delete(key: string): Promise<void> {
    this.logger.log(`Deleting ${key} from B2`)
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    )
  }

  /**
   * Extract the object key from a stored key/path string.
   * Keys are stored directly (e.g. "listings/abc.jpg"), so this is a passthrough.
   */
  keyFromUrl(keyOrUrl: string): string {
    // If someone accidentally stored a full URL, strip the bucket prefix
    const marker = `/file/${this.bucket}/`
    const idx = keyOrUrl.indexOf(marker)
    return idx !== -1 ? keyOrUrl.slice(idx + marker.length) : keyOrUrl
  }
}
