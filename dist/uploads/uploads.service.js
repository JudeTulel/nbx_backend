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
const config_1 = require("@nestjs/config");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("../companies/company.schema");
const kyc_schema_1 = require("../kyc/kyc.schema");
const client_s3_1 = require("@aws-sdk/client-s3");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const stream_1 = require("stream");
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
    configService;
    logger = new common_1.Logger(UploadsService_1.name);
    uploadDir = path.join(process.cwd(), 'uploads');
    s3Client;
    bucketName;
    region;
    publicBaseUrl;
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
    constructor(companyModel, kycModel, configService) {
        this.companyModel = companyModel;
        this.kycModel = kycModel;
        this.configService = configService;
        this.region = this.configService.get('AWS_REGION') || 'us-east-1';
        this.bucketName = this.configService.get('AWS_S3_BUCKET') || '';
        this.publicBaseUrl = this.configService.get('AWS_S3_PUBLIC_BASE_URL');
        const s3Config = {
            region: this.region,
            forcePathStyle: (this.configService.get('AWS_S3_FORCE_PATH_STYLE') || 'false').toLowerCase() ===
                'true',
        };
        const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
        const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');
        if (accessKeyId && secretAccessKey) {
            s3Config.credentials = { accessKeyId, secretAccessKey };
        }
        const endpoint = this.configService.get('AWS_S3_ENDPOINT');
        if (endpoint) {
            s3Config.endpoint = endpoint;
        }
        this.s3Client = new client_s3_1.S3Client(s3Config);
        if (!this.bucketName) {
            this.logger.warn('AWS_S3_BUCKET is not configured. Upload endpoints will fail until it is set.');
        }
        this.ensureUploadDirectories();
    }
    ensureS3Configured() {
        if (!this.bucketName) {
            throw new common_1.InternalServerErrorException('AWS S3 bucket is not configured');
        }
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
    generateObjectKey(category, fileName) {
        return `${category}/${fileName}`;
    }
    buildPublicUrl(key) {
        if (this.publicBaseUrl) {
            return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
        }
        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }
    async streamToBuffer(body) {
        if (!body) {
            throw new common_1.NotFoundException('File body is empty');
        }
        if (Buffer.isBuffer(body)) {
            return body;
        }
        if (body instanceof stream_1.Readable) {
            const chunks = [];
            for await (const chunk of body) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            return Buffer.concat(chunks);
        }
        throw new common_1.InternalServerErrorException('Unsupported S3 object body type');
    }
    extractObjectKey(value) {
        if (!value) {
            return null;
        }
        const normalized = value.replace(/\\/g, '/');
        if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
            try {
                const pathname = decodeURIComponent(new URL(normalized).pathname).replace(/^\/+/, '');
                if (pathname.startsWith(`${this.bucketName}/`)) {
                    return pathname.substring(this.bucketName.length + 1);
                }
                return pathname || null;
            }
            catch {
                return null;
            }
        }
        const uploadsMarker = '/uploads/';
        const uploadsIndex = normalized.lastIndexOf(uploadsMarker);
        if (uploadsIndex >= 0) {
            return normalized.substring(uploadsIndex + uploadsMarker.length);
        }
        for (const category of Object.values(UploadCategory)) {
            const categoryMarker = `/${category}/`;
            const categoryIndex = normalized.lastIndexOf(categoryMarker);
            if (categoryIndex >= 0) {
                return normalized.substring(categoryIndex + 1);
            }
            if (normalized.startsWith(`${category}/`)) {
                return normalized;
            }
        }
        return normalized.includes('/') ? normalized : null;
    }
    getLegacyLocalPathFromKey(objectKey) {
        return path.join(this.uploadDir, objectKey);
    }
    async listAllObjects(prefix) {
        this.ensureS3Configured();
        const results = [];
        let continuationToken;
        do {
            const response = await this.s3Client.send(new client_s3_1.ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
            }));
            for (const item of response.Contents || []) {
                if (item.Key) {
                    results.push({ key: item.Key, size: item.Size || 0 });
                }
            }
            continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
        } while (continuationToken);
        return results;
    }
    async uploadFile(file, category, metadata) {
        try {
            this.ensureS3Configured();
            this.validateFile(file, category);
            const fileExtension = path.extname(file.originalname);
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
            const objectKey = this.generateObjectKey(category, fileName);
            await this.s3Client.send(new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: objectKey,
                Body: file.buffer,
                ContentType: file.mimetype,
                Metadata: metadata,
            }));
            const publicUrl = this.buildPublicUrl(objectKey);
            this.logger.log(`File uploaded: ${fileName} (${category})`);
            return {
                fileName,
                originalName: file.originalname,
                filePath: objectKey,
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
        this.ensureS3Configured();
        const objectKey = this.generateObjectKey(category, fileName);
        try {
            const response = await this.s3Client.send(new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: objectKey,
            }));
            return this.streamToBuffer(response.Body);
        }
        catch (error) {
            const legacyPath = this.getLegacyLocalPathFromKey(objectKey);
            if (fs.existsSync(legacyPath)) {
                return fs.readFileSync(legacyPath);
            }
            if (error?.name === 'NoSuchKey') {
                throw new common_1.NotFoundException('File not found');
            }
            this.logger.error(`Failed to get file: ${error.message}`);
            throw error;
        }
    }
    async deleteFile(filePath) {
        try {
            const objectKey = this.extractObjectKey(filePath);
            if (objectKey) {
                this.ensureS3Configured();
                await this.s3Client.send(new client_s3_1.DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: objectKey,
                }));
                this.logger.log(`S3 file deleted: ${objectKey}`);
                return;
            }
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`Legacy local file deleted: ${filePath}`);
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
            const frontPath = this.extractObjectKey(kyc.frontImageUrl) || '';
            const backPath = this.extractObjectKey(kyc.backImageUrl) || '';
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
                    const key = this.extractObjectKey(doc.path) ||
                        (doc.fileName
                            ? this.generateObjectKey(UploadCategory.COMPANY_DOCUMENTS, doc.fileName)
                            : null);
                    if (key) {
                        referencedCompanyFiles.add(key);
                    }
                });
            });
            const kycDocs = await this.kycModel
                .find()
                .select('frontImageUrl backImageUrl');
            const referencedKYCFiles = new Set();
            kycDocs.forEach((kyc) => {
                const frontKey = this.extractObjectKey(kyc.frontImageUrl);
                const backKey = this.extractObjectKey(kyc.backImageUrl);
                if (frontKey) {
                    referencedKYCFiles.add(frontKey);
                }
                if (backKey) {
                    referencedKYCFiles.add(backKey);
                }
            });
            const companyObjects = await this.listAllObjects(`${UploadCategory.COMPANY_DOCUMENTS}/`);
            for (const object of companyObjects) {
                if (!referencedCompanyFiles.has(object.key)) {
                    await this.deleteFile(object.key);
                    deletedCount++;
                }
            }
            const kycObjects = await this.listAllObjects(`${UploadCategory.KYC_DOCUMENTS}/`);
            for (const object of kycObjects) {
                if (!referencedKYCFiles.has(object.key)) {
                    await this.deleteFile(object.key);
                    deletedCount++;
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
        this.ensureS3Configured();
        try {
            const stats = {
                totalSize: 0,
                categorySizes: {},
                fileCount: 0,
            };
            Object.values(UploadCategory).forEach((category) => {
                stats.categorySizes[category] = 0;
            });
            for (const category of Object.values(UploadCategory)) {
                const objects = await this.listAllObjects(`${category}/`);
                const categorySize = objects.reduce((sum, object) => sum + object.size, 0);
                const categoryCount = objects.length;
                stats.categorySizes[category] = categorySize;
                stats.totalSize += categorySize;
                stats.fileCount += categoryCount;
            }
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
        mongoose_2.Model,
        config_1.ConfigService])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map