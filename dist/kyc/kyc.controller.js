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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const kyc_service_1 = require("./kyc.service");
const uploads_service_1 = require("../uploads/uploads.service");
const kyc_dto_1 = require("./dto/kyc.dto");
let KYCController = class KYCController {
    kycService;
    uploadsService;
    constructor(kycService, uploadsService) {
        this.kycService = kycService;
        this.uploadsService = uploadsService;
    }
    async submitKYC(dto, files) {
        if (!files.frontImage || !files.backImage) {
            throw new common_1.BadRequestException('Both front and back images are required');
        }
        const { frontImageUrl, backImageUrl } = await this.uploadsService.uploadKYCDocuments(dto.userId, files.frontImage[0], files.backImage[0]);
        const result = await this.kycService.submitKYC(dto, frontImageUrl, backImageUrl);
        return {
            success: true,
            message: 'KYC submitted successfully',
            data: result,
        };
    }
    async getKYCStatusByUserId(userId) {
        const result = await this.kycService.getKYCByUserId(userId);
        return {
            success: true,
            data: result,
        };
    }
    async getKYCStatusByEmail(email) {
        const result = await this.kycService.getKYCByEmail(email);
        return {
            success: true,
            data: result,
        };
    }
    async checkKYCApproval(userId) {
        const isApproved = await this.kycService.isKYCApproved(userId);
        return {
            success: true,
            isApproved,
        };
    }
    async getAllKYC(query) {
        const results = await this.kycService.getAllKYC(query);
        return {
            success: true,
            count: results.length,
            data: results,
        };
    }
    async getKYCStats() {
        const stats = await this.kycService.getKYCStats();
        return {
            success: true,
            data: stats,
        };
    }
    async reviewKYC(id, dto) {
        const result = await this.kycService.reviewKYC(id, dto);
        return {
            success: true,
            message: 'KYC reviewed successfully',
            data: result,
        };
    }
    async deleteKYC(id) {
        await this.kycService.deleteKYC(id);
        return {
            success: true,
            message: 'KYC deleted successfully',
        };
    }
};
exports.KYCController = KYCController;
__decorate([
    (0, common_1.Post)('submit'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kyc_dto_1.SubmitKYCDto, Object]),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "submitKYC", null);
__decorate([
    (0, common_1.Get)('status/user/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "getKYCStatusByUserId", null);
__decorate([
    (0, common_1.Get)('status/email/:email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "getKYCStatusByEmail", null);
__decorate([
    (0, common_1.Get)('check/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "checkKYCApproval", null);
__decorate([
    (0, common_1.Get)('all'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kyc_dto_1.KYCQueryDto]),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "getAllKYC", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "getKYCStats", null);
__decorate([
    (0, common_1.Put)('review/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kyc_dto_1.ReviewKYCDto]),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "reviewKYC", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KYCController.prototype, "deleteKYC", null);
exports.KYCController = KYCController = __decorate([
    (0, common_1.Controller)('kyc'),
    __metadata("design:paramtypes", [kyc_service_1.KYCService,
        uploads_service_1.UploadsService])
], KYCController);
//# sourceMappingURL=kyc.controller.js.map