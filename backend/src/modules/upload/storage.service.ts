import { Injectable, Logger } from '@nestjs/common'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

/**
 * StorageService — uploads files to Cloudinary.
 * Images are stored publicly; no presigned URLs needed.
 *
 * Required environment variables:
 *   CLOUDINARY_CLOUD_NAME   e.g. piyrox
 *   CLOUDINARY_API_KEY      from Cloudinary dashboard
 *   CLOUDINARY_API_SECRET   from Cloudinary dashboard
 *
 * Optional:
 *   CLOUDINARY_FOLDER       root folder prefix (default: "piyrox")
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name)
  private readonly rootFolder: string
  private readonly configured: boolean

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    this.rootFolder = process.env.CLOUDINARY_FOLDER || 'piyrox'

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn(
        'Cloudinary not fully configured — uploads will fail. ' +
          'Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
      )
      this.configured = false
    } else {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret })
      this.configured = true
    }
  }

  /**
   * Upload a buffer to Cloudinary.
   * Returns the secure HTTPS URL of the uploaded asset.
   *
   * @param buffer    File contents
   * @param key       Logical path used as the public_id, e.g. "listings/abc123"
   * @param mimeType  e.g. "image/jpeg"
   */
  async upload(buffer: Buffer, key: string, mimeType: string): Promise<string> {
    this.logger.log(`Uploading ${key} (${mimeType}) to Cloudinary`)

    // Strip extension from key — Cloudinary manages format itself
    const publicId = `${this.rootFolder}/${key.replace(/\.[^/.]+$/, '')}`

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: 'image',
          overwrite: true,
          // Auto-quality and auto-format for optimized delivery
          transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('No result from Cloudinary'))
          resolve(result)
        },
      )
      stream.end(buffer)
    })

    this.logger.log(`Uploaded → ${result.secure_url}`)
    return result.secure_url
  }

  /**
   * Returns the Cloudinary URL for a given key.
   * Since assets are public, this just constructs the URL — no signing needed.
   * Pass the full URL returned by upload() directly, or reconstruct from key.
   *
   * @param keyOrUrl  The secure_url returned by upload(), or the logical key
   */
  getUrl(keyOrUrl: string): string {
    // If it's already a full URL, return as-is
    if (keyOrUrl.startsWith('http')) return keyOrUrl

    // Reconstruct from key (strip extension, build Cloudinary URL)
    const publicId = `${this.rootFolder}/${keyOrUrl.replace(/\.[^/.]+$/, '')}`
    return cloudinary.url(publicId, { secure: true, fetch_format: 'auto', quality: 'auto' })
  }

  /**
   * Kept for backwards-compatibility — delegates to getUrl().
   * Previously returned a time-limited presigned URL; now returns a permanent public URL.
   */
  async getPresignedUrl(keyOrUrl: string, _ttlSeconds?: number): Promise<string> {
    return this.getUrl(keyOrUrl)
  }

  /**
   * Delete an asset from Cloudinary by its key or public_id.
   */
  async delete(keyOrUrl: string): Promise<void> {
    // Derive public_id from key or URL
    let publicId: string
    if (keyOrUrl.startsWith('http')) {
      // Extract public_id from URL: everything between /upload/ and the extension
      const match = keyOrUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/)
      publicId = match ? match[1] : keyOrUrl
    } else {
      publicId = `${this.rootFolder}/${keyOrUrl.replace(/\.[^/.]+$/, '')}`
    }

    this.logger.log(`Deleting Cloudinary asset: ${publicId}`)
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' })
  }

  /**
   * Extract the key from a stored URL or key string (passthrough for Cloudinary).
   */
  keyFromUrl(keyOrUrl: string): string {
    return keyOrUrl
  }

  isConfigured(): boolean {
    return this.configured
  }
}
