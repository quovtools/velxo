import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
export interface ApiError {
    success: boolean;
    message: string;
    data: null;
    errors?: any[];
}
export declare class HttpExceptionFilter implements ExceptionFilter<Error> {
    catch(exception: unknown, host: ArgumentsHost): void;
}
