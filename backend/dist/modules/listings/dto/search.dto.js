"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchListingsDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class SearchListingsDto {
}
exports.SearchListingsDto = SearchListingsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SearchListingsDto.prototype, "gameName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SearchListingsDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SearchListingsDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SearchListingsDto.prototype, "platform", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Number)
], SearchListingsDto.prototype, "minPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Number)
], SearchListingsDto.prototype, "maxPrice", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], SearchListingsDto.prototype, "sort", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, minimum: 1 }),
    __metadata("design:type", Number)
], SearchListingsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false, minimum: 0 }),
    __metadata("design:type", Number)
], SearchListingsDto.prototype, "offset", void 0);
//# sourceMappingURL=search.dto.js.map