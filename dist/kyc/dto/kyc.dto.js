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
exports.KYCQueryDto = exports.ReviewKYCDto = exports.SubmitKYCDto = void 0;
const class_validator_1 = require("class-validator");
const kyc_schema_1 = require("../kyc.schema");
class SubmitKYCDto {
    userId;
    useremail;
    fullName;
    idNumber;
    documentType;
}
exports.SubmitKYCDto = SubmitKYCDto;
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitKYCDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SubmitKYCDto.prototype, "useremail", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], SubmitKYCDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(5),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], SubmitKYCDto.prototype, "idNumber", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(kyc_schema_1.KYCDocumentType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SubmitKYCDto.prototype, "documentType", void 0);
class ReviewKYCDto {
    status;
    rejectionReason;
    reviewedBy;
}
exports.ReviewKYCDto = ReviewKYCDto;
__decorate([
    (0, class_validator_1.IsEnum)(kyc_schema_1.KYCStatus),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReviewKYCDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReviewKYCDto.prototype, "rejectionReason", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ReviewKYCDto.prototype, "reviewedBy", void 0);
class KYCQueryDto {
    status;
    useremail;
    userId;
}
exports.KYCQueryDto = KYCQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(kyc_schema_1.KYCStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KYCQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KYCQueryDto.prototype, "useremail", void 0);
__decorate([
    (0, class_validator_1.IsMongoId)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], KYCQueryDto.prototype, "userId", void 0);
//# sourceMappingURL=kyc.dto.js.map