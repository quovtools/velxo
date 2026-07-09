import { HttpException } from '@nestjs/common';
export declare class ValidationException extends HttpException {
    constructor(message: string, errors?: any);
}
export declare class UnauthorizedException extends HttpException {
    constructor(message?: string);
}
export declare class ForbiddenException extends HttpException {
    constructor(message?: string);
}
export declare class NotFoundException extends HttpException {
    constructor(resource: string);
}
export declare class ConflictException extends HttpException {
    constructor(message: string);
}
export declare class BadRequestException extends HttpException {
    constructor(message?: string);
}
export declare class InsufficientFundsException extends HttpException {
    constructor(message?: string);
}
export declare class FraudDetectedException extends HttpException {
    constructor(message?: string);
}
export declare class InvalidEscrowStateException extends HttpException {
    constructor(message?: string);
}
