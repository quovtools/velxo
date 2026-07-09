"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidEscrowStateException = exports.FraudDetectedException = exports.InsufficientFundsException = exports.BadRequestException = exports.ConflictException = exports.NotFoundException = exports.ForbiddenException = exports.UnauthorizedException = exports.ValidationException = void 0;
const common_1 = require("@nestjs/common");
class ValidationException extends common_1.HttpException {
    constructor(message, errors) {
        super({
            success: false,
            message,
            errors,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.ValidationException = ValidationException;
class UnauthorizedException extends common_1.HttpException {
    constructor(message = 'Unauthorized') {
        super({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.UNAUTHORIZED);
    }
}
exports.UnauthorizedException = UnauthorizedException;
class ForbiddenException extends common_1.HttpException {
    constructor(message = 'Forbidden') {
        super({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.ForbiddenException = ForbiddenException;
class NotFoundException extends common_1.HttpException {
    constructor(resource) {
        super({
            success: false,
            message: `${resource} not found`,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.NotFoundException = NotFoundException;
class ConflictException extends common_1.HttpException {
    constructor(message) {
        super({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.CONFLICT);
    }
}
exports.ConflictException = ConflictException;
class BadRequestException extends common_1.HttpException {
    constructor(message = 'Bad request') {
        super({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.BadRequestException = BadRequestException;
class InsufficientFundsException extends common_1.HttpException {
    constructor(message = 'Insufficient funds') {
        super({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InsufficientFundsException = InsufficientFundsException;
class FraudDetectedException extends common_1.HttpException {
    constructor(message = 'Suspicious activity detected') {
        super({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.FORBIDDEN);
    }
}
exports.FraudDetectedException = FraudDetectedException;
class InvalidEscrowStateException extends common_1.HttpException {
    constructor(message = 'Invalid escrow state') {
        super({
            success: false,
            message,
            timestamp: new Date().toISOString(),
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InvalidEscrowStateException = InvalidEscrowStateException;
//# sourceMappingURL=custom-exceptions.js.map