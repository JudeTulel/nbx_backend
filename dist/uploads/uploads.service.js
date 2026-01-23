"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UploadsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = exports.UploadCategory = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../companies/company.schema");
const kyc_schema_1 = require("../kyc/kyc.schema");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
var UploadCategory;
(function (UploadCategory) {
    UploadCategory["COMPANY_DOCUMENTS"] = "company-documents";
    UploadCategory["KYC_DOCUMENTS"] = "kyc-documents";
    UploadCategory["PROFILE_PICTURES"] = "profile-pictures";
    UploadCategory["INVOICES"] = "invoices";
    UploadCategory["CONTRACTS"] = "contracts";
    UploadCategory["REPORTS"] = "reports";
})(UploadCategory || (exports.UploadCategory = UploadCategory = {}));
let UploadsService = UploadsService_1 = class UploadsService {
    companyModel;
    kycModel;
    logger = new common_1.Logger(UploadsService_1.name);
    uploadDir = path.join(process.cwd(), 'uploads');
    allowedMimeTypes = {
        [UploadCategory.COMPANY_DOCUMENTS]: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg',
            'image/png',
        ],
        [UploadCategory.KYC_DOCUMENTS]: [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/pdf',
        ],
        [UploadCategory.PROFILE_PICTURES]: [
            'image/jpeg',
            'image/png',
            'image/jpg',
            'image/webp',
        ],
        [UploadCategory.INVOICES]: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ],
        [UploadCategory.CONTRACTS]: ['application/pdf'],
        [UploadCategory.REPORTS]: [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
        ],
    };
    sizeLimits = {
        [UploadCategory.COMPANY_DOCUMENTS]: 10 * 1024 * 1024,
        [UploadCategory.KYC_DOCUMENTS]: 5 * 1024 * 1024,
        [UploadCategory.PROFILE_PICTURES]: 2 * 1024 * 1024,
        [UploadCategory.INVOICES]: 10 * 1024 * 1024,
        [UploadCategory.CONTRACTS]: 10 * 1024 * 1024,
        [UploadCategory.REPORTS]: 15 * 1024 * 1024,
    };
    constructor(companyModel, kycModel) {
        this.companyModel = companyModel;
        this.kycModel = kycModel;
        this.ensureUploadDirectories();
    }
    ensureUploadDirectories() {
        Object.values(UploadCategory).forEach((category) => {
            const dir = path.join(this.uploadDir, category);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    validateFile(file, category) {
        const allowedTypes = this.allowedMimeTypes[category];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`File type ${file.mimetype} not allowed for ${category}. Allowed types: ${allowedTypes.join(', ')}`);
        }
        const sizeLimit = this.sizeLimits[category];
        if (file.size > sizeLimit) {
            throw new common_1.BadRequestException(`File size exceeds limit of ${sizeLimit / (1024 * 1024)}MB for ${category}`);
        }
    }
    async uploadFile(file, category, metadata) {
        try {
            this.validateFile(file, category);
            const fileExtension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
            const categoryDir = path.join(this.uploadDir, category);
            const filePath = path.join(categoryDir, fileName);
            fs.writeFileSync(filePath, file.buffer);
            const publicUrl = `/uploads/${category}/${fileName}`;
            this.logger.log(`File uploaded: ${fileName} (${category})`);
            return {
                fileName,
                originalName: file.originalname,
                filePath,
                publicUrl,
                size: file.size,
                mimeType: file.mimetype,
                category,
                uploadedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to upload file: ${error.message}`);
            throw error;
        }
    }
    async uploadMultipleFiles(files, category) {
        const results = [];
        for (const file of files) {
            const result = await this.uploadFile(file, category);
            results.push(result);
        }
        return results;
    }
    async uploadCompanyDocument(companyId, file, documentType) {
        try {
            const company = await this.companyModel.findById(companyId);
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            const uploadResult = await this.uploadFile(file, UploadCategory.COMPANY_DOCUMENTS);
            const documentEntry = {
                name: file.originalname,
                type: documentType,
                fileName: uploadResult.fileName,
                path: uploadResult.filePath,
                url: uploadResult.publicUrl,
                size: file.size,
                mimeType: file.mimetype,
                uploadedAt: new Date(),
            };
            await this.companyModel.findByIdAndUpdate(companyId, {
                $push: { documents: documentEntry },
            });
            this.logger.log(`Document uploaded for company ${companyId}: ${file.originalname}`);
            return {
                success: true,
                message: 'Document uploaded successfully',
                document: documentEntry,
            };
        }
        catch (error) {
            this.logger.error(`Failed to upload company document: ${error.message}`);
            throw error;
        }
    }
    async uploadKYCDocuments(userId, frontImage, backImage) {
        try {
            const frontResult = await this.uploadFile(frontImage, UploadCategory.KYC_DOCUMENTS);
            const backResult = await this.uploadFile(backImage, UploadCategory.KYC_DOCUMENTS);
            this.logger.log(`KYC documents uploaded for user ${userId}`);
            return {
                frontImageUrl: frontResult.publicUrl,
                backImageUrl: backResult.publicUrl,
            };
        }
        catch (error) {
            this.logger.error(`Failed to upload KYC documents: ${error.message}`);
            throw error;
        }
    }
    async uploadProfilePicture(userId, file) {
        try {
            const result = await this.uploadFile(file, UploadCategory.PROFILE_PICTURES);
            this.logger.log(`Profile picture uploaded for user ${userId}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to upload profile picture: ${error.message}`);
            throw error;
        }
    }
    async getFile(category, fileName) {
        try {
            const filePath = path.join(this.uploadDir, category, fileName);
            if (!fs.existsSync(filePath)) {
                throw new common_1.NotFoundException('File not found');
            }
            return fs.readFileSync(filePath);
        }
        catch (error) {
            this.logger.error(`Failed to get file: ${error.message}`);
            throw error;
        }
    }
    async deleteFile(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`File deleted: ${filePath}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to delete file: ${error.message}`);
            throw error;
        }
    }
    async deleteCompanyDocument(companyId, documentId) {
        try {
            const company = await this.companyModel.findById(companyId);
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            const documentIndex = company.documents.findIndex((doc) => doc._id.toString() === documentId);
            if (documentIndex === -1) {
                throw new common_1.NotFoundException('Document not found');
            }
            const document = company.documents[documentIndex];
            await this.deleteFile(document.path);
            company.documents.splice(documentIndex, 1);
            await company.save();
            this.logger.log(`Document deleted for company ${companyId}: ${document.name}`);
            return {
                success: true,
                message: 'Document deleted successfully',
            };
        }
        catch (error) {
            this.logger.error(`Failed to delete company document: ${error.message}`);
            throw error;
        }
    }
    async deleteKYCDocuments(kycId) {
        try {
            const kyc = await this.kycModel.findById(kycId);
            if (!kyc) {
                throw new common_1.NotFoundException('KYC record not found');
            }
            const frontPath = path.join(this.uploadDir, kyc.frontImageUrl.replace('/uploads/', ''));
            const backPath = path.join(this.uploadDir, kyc.backImageUrl.replace('/uploads/', ''));
            await this.deleteFile(frontPath);
            await this.deleteFile(backPath);
            this.logger.log(`KYC documents deleted for KYC ${kycId}`);
        }
        catch (error) {
            this.logger.error(`Failed to delete KYC documents: ${error.message}`);
            throw error;
        }
    }
    async getCompanyDocuments(companyId) {
        try {
            const company = await this.companyModel
                .findById(companyId)
                .select('documents');
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            return company.documents || [];
        }
        catch (error) {
            this.logger.error(`Failed to get company documents: ${error.message}`);
            throw error;
        }
    }
    async cleanupOrphanedFiles() {
        let deletedCount = 0;
        try {
            const companies = await this.companyModel.find().select('documents');
            const referencedCompanyFiles = new Set();
            companies.forEach((company) => {
                company.documents?.forEach((doc) => {
                    if (doc.fileName) {
                        referencedCompanyFiles.add(doc.fileName);
                    }
                });
            });
            const kycDocs = await this.kycModel
                .find()
                .select('frontImageUrl backImageUrl');
            const referencedKYCFiles = new Set();
            kycDocs.forEach((kyc) => {
                if (kyc.frontImageUrl) {
                    const fileName = path.basename(kyc.frontImageUrl);
                    referencedKYCFiles.add(fileName);
                }
                if (kyc.backImageUrl) {
                    const fileName = path.basename(kyc.backImageUrl);
                    referencedKYCFiles.add(fileName);
                }
            });
            const companyDocsDir = path.join(this.uploadDir, UploadCategory.COMPANY_DOCUMENTS);
            if (fs.existsSync(companyDocsDir)) {
                const files = fs.readdirSync(companyDocsDir);
                for (const file of files) {
                    if (!referencedCompanyFiles.has(file)) {
                        const filePath = path.join(companyDocsDir, file);
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                }
            }
            const kycDocsDir = path.join(this.uploadDir, UploadCategory.KYC_DOCUMENTS);
            if (fs.existsSync(kycDocsDir)) {
                const files = fs.readdirSync(kycDocsDir);
                for (const file of files) {
                    if (!referencedKYCFiles.has(file)) {
                        const filePath = path.join(kycDocsDir, file);
                        fs.unlinkSync(filePath);
                        deletedCount++;
                    }
                }
            }
            this.logger.log(`Cleaned up ${deletedCount} orphaned files`);
            return { deletedCount };
        }
        catch (error) {
            this.logger.error(`Failed to cleanup orphaned files: ${error.message}`);
            throw error;
        }
    }
    async getStorageStats() {
        try {
            const stats = {
                totalSize: 0,
                categorySizes: {},
                fileCount: 0,
            };
            Object.values(UploadCategory).forEach((category) => {
                const categoryDir = path.join(this.uploadDir, category);
                let categorySize = 0;
                let fileCount = 0;
                if (fs.existsSync(categoryDir)) {
                    const files = fs.readdirSync(categoryDir);
                    fileCount = files.length;
                    files.forEach((file) => {
                        const filePath = path.join(categoryDir, file);
                        const fileStats = fs.statSync(filePath);
                        categorySize += fileStats.size;
                    });
                }
                stats.categorySizes[category] = categorySize;
                stats.totalSize += categorySize;
                stats.fileCount += fileCount;
            });
            return stats;
        }
        catch (error) {
            this.logger.error(`Failed to get storage stats: ${error.message}`);
            throw error;
        }
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = UploadsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(1, (0, mongoose_1.InjectModel)(kyc_schema_1.KYC.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map