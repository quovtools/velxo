"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            }
            else if (typeof exceptionResponse === 'object') {
                message = exceptionResponse?.message || exception.message;
                errors = exceptionResponse?.errors;
            }
        }
        else if (exception instanceof Error) {
            message = exception.message;
        }
        const logContext = {
            method: request.method,
            url: request.url,
            status,
            message,
            body: this.scrubBody(request.body),
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        };
        if (status >= 500) {
            this.logger.error(`[${logContext.method}] ${logContext.url} → ${status} | ${message}`, exception instanceof Error ? exception.stack : String(exception));
            this.logger.error('Request context: ' + JSON.stringify(logContext));
        }
        else {
            this.logger.warn(`[${logContext.method}] ${logContext.url} → ${status} | ${message} | body: ${JSON.stringify(logContext.body)}`);
        }
        const body = {
            success: false,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        if (errors !== undefined)
            body.errors = errors;
        response.status(status).json(body);
    }
    scrubBody(body) {
        if (!body || typeof body !== 'object')
            return body;
        const scrubbed = { ...body };
        const sensitiveKeys = ['password', 'newPassword', 'oldPassword', 'token', 'accessToken', 'refreshToken'];
        for (const key of sensitiveKeys) {
            if (key in scrubbed)
                scrubbed[key] = '[REDACTED]';
        }
        return scrubbed;
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map