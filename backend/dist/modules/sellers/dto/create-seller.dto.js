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
exports.SubmitKycDto = exports.UploadVerificationDocumentsDto = exports.UpdateSellerDto = exports.CreateSellerDto = void 0;
const class_validator_1 = require("class-validator");
class CreateSellerDto {
}
exports.CreateSellerDto = CreateSellerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "storeName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateSellerDto.prototype, "storeDescription", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateSellerDto.prototype, "responseTime", void 0);
class UpdateSellerDto {
}
exports.UpdateSellerDto = UpdateSellerDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "storeName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateSellerDto.prototype, "storeDescription", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateSellerDto.prototype, "responseTime", void 0);
class UploadVerificationDocumentsDto {
}
exports.UploadVerificationDocumentsDto = UploadVerificationDocumentsDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadVerificationDocumentsDto.prototype, "documentType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UploadVerificationDocumentsDto.prototype, "documentUrl", void 0);
class SubmitKycDto {
}
exports.SubmitKycDto = SubmitKycDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "idType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "documentNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "idImageUrl", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitKycDto.prototype, "selfieImageUrl", void 0);
//# sourceMappingURL=create-seller.dto.js.map