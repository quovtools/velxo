export declare class ApiResponseDto<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    meta?: Record<string, any>;
    timestamp: string;
    constructor(success: boolean, data?: T, message?: string, error?: string, meta?: Record<string, any>);
    static ok<T>(data: T, message?: string, meta?: Record<string, any>): ApiResponseDto<T>;
    static error(message: string, error?: string, meta?: Record<string, any>): ApiResponseDto;
}
