import { HttpException, HttpStatus } from '@nestjs/common'

export class ValidationException extends HttpException {
  constructor(message: string, errors?: any) {
    super(
      {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message: string = 'Unauthorized') {
    super(
      {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.UNAUTHORIZED,
    )
  }
}

export class ForbiddenException extends HttpException {
  constructor(message: string = 'Forbidden') {
    super(
      {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.FORBIDDEN,
    )
  }
}

export class NotFoundException extends HttpException {
  constructor(resource: string) {
    super(
      {
        success: false,
        message: `${resource} not found`,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.NOT_FOUND,
    )
  }
}

export class ConflictException extends HttpException {
  constructor(message: string) {
    super(
      {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.CONFLICT,
    )
  }
}

export class BadRequestException extends HttpException {
  constructor(message: string = 'Bad request') {
    super(
      {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}

export class InsufficientFundsException extends HttpException {
  constructor(message: string = 'Insufficient funds') {
    super(
      {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}

export class FraudDetectedException extends HttpException {
  constructor(message: string = 'Suspicious activity detected') {
    super(
      {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.FORBIDDEN,
    )
  }
}

export class InvalidEscrowStateException extends HttpException {
  constructor(message: string = 'Invalid escrow state') {
    super(
      {
        success: false,
        message,
        timestamp: new Date().toISOString(),
      },
      HttpStatus.BAD_REQUEST,
    )
  }
}
