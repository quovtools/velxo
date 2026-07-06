export class ApiResponseDto<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  meta?: Record<string, any>
  timestamp: string

  constructor(
    success: boolean,
    data?: T,
    message?: string,
    error?: string,
    meta?: Record<string, any>,
  ) {
    this.success = success
    this.data = data
    this.message = message
    this.error = error
    this.meta = meta
    this.timestamp = new Date().toISOString()
  }

  static ok<T>(data: T, message?: string, meta?: Record<string, any>): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message, undefined, meta)
  }

  static error(message: string, error?: string, meta?: Record<string, any>): ApiResponseDto {
    return new ApiResponseDto(false, undefined, message, error, meta)
  }
}
