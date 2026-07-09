"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponseDto = void 0;
class ApiResponseDto {
    constructor(success, data, message, error, meta) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.error = error;
        this.meta = meta;
        this.timestamp = new Date().toISOString();
    }
    static ok(data, message, meta) {
        return new ApiResponseDto(true, data, message, undefined, meta);
    }
    static error(message, error, meta) {
        return new ApiResponseDto(false, undefined, message, error, meta);
    }
}
exports.ApiResponseDto = ApiResponseDto;
//# sourceMappingURL=api-response.dto.js.map