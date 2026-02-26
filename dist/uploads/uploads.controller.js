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
exports.UploadsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const uploads_service_1 = require("./uploads.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let UploadsController = class UploadsController {
    uploadsService;
    constructor(uploadsService) {
        this.uploadsService = uploadsService;
    }
    async uploadCompanyDocument(companyId, file, documentType) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        if (!documentType) {
            throw new common_1.BadRequestException('Document type is required');
        }
        return this.uploadsService.uploadCompanyDocument(companyId, file, documentType);
    }
    async uploadKYCDocuments(userId, files) {
        if (!files.frontImage || !files.backImage) {
            throw new common_1.BadRequestException('Both front and back images are required');
        }
        const result = await this.uploadsService.uploadKYCDocuments(userId, files.frontImage[0], files.backImage[0]);
        return {
            success: true,
            message: 'KYC documents uploaded successfully',
            data: result,
        };
    }
    async uploadProfilePicture(userId, file) {
        if (!file) {
            throw new common_1.BadRequestException('File is required');
        }
        const result = await this.uploadsService.uploadProfilePicture(userId, file);
        return {
            success: true,
            message: 'Profile picture uploaded successfully',
            data: result,
        };
    }
    async getFile(category, fileName, res) {
        if (!Object.values(uploads_service_1.UploadCategory).includes(category)) {
            throw new common_1.BadRequestException('Invalid upload category');
        }
        const fileBuffer = await this.uploadsService.getFile(category, fileName);
        const ext = fileName.split('.').pop()?.toLowerCase();
        const contentTypes = {
            pdf: 'application/pdf',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            webp: 'image/webp',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xls: 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        };
        const contentType = contentTypes[ext || ''] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.send(fileBuffer);
    }
    async downloadFile(category, fileName, res) {
        if (!Object.values(uploads_service_1.UploadCategory).includes(category)) {
            throw new common_1.BadRequestException('Invalid upload category');
        }
        const fileBuffer = await this.uploadsService.getFile(category, fileName);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(fileBuffer);
    }
    async getCompanyDocuments(companyId) {
        const documents = await this.uploadsService.getCompanyDocuments(companyId);
        return {
            success: true,
            count: documents.length,
            data: documents,
        };
    }
    async deleteCompanyDocument(companyId, documentId) {
        return this.uploadsService.deleteCompanyDocument(companyId, documentId);
    }
    async getStorageStats() {
        const stats = await this.uploadsService.getStorageStats();
        return {
            success: true,
            data: stats,
        };
    }
    async cleanupOrphanedFiles() {
        const result = await this.uploadsService.cleanupOrphanedFiles();
        return {
            success: true,
            message: `Deleted ${result.deletedCount} orphaned files`,
            data: result,
        };
    }
};
exports.UploadsController = UploadsController;
__decorate([
    (0, common_1.Post)('company/:companyId/document'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('documentType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadCompanyDocument", null);
__decorate([
    (0, common_1.Post)('kyc/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
        { name: 'frontImage', maxCount: 1 },
        { name: 'backImage', maxCount: 1 },
    ])),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadKYCDocuments", null);
__decorate([
    (0, common_1.Post)('profile/:userId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "uploadProfilePicture", null);
__decorate([
    (0, common_1.Get)(':category/:fileName'),
    __param(0, (0, common_1.Param)('category')),
    __param(1, (0, common_1.Param)('fileName')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getFile", null);
__decorate([
    (0, common_1.Get)(':category/:fileName/download'),
    __param(0, (0, common_1.Param)('category')),
    __param(1, (0, common_1.Param)('fileName')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Get)('company/:companyId/documents'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getCompanyDocuments", null);
__decorate([
    (0, common_1.Delete)('company/:companyId/document/:documentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('companyId')),
    __param(1, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "deleteCompanyDocument", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "getStorageStats", null);
__decorate([
    (0, common_1.Post)('admin/cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UploadsController.prototype, "cleanupOrphanedFiles", null);
exports.UploadsController = UploadsController = __decorate([
    (0, common_1.Controller)('uploads'),
    __metadata("design:paramtypes", [uploads_service_1.UploadsService])
], UploadsController);
//# sourceMappingURL=uploads.controller.js.map