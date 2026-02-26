import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Company } from '../companies/company.schema';
import { KYC } from '../kyc/kyc.schema';
export declare enum UploadCategory {
    COMPANY_DOCUMENTS = "company-documents",
    KYC_DOCUMENTS = "kyc-documents",
    PROFILE_PICTURES = "profile-pictures",
    INVOICES = "invoices",
    CONTRACTS = "contracts",
    REPORTS = "reports"
}
export interface UploadResult {
    fileName: string;
    originalName: string;
    filePath: string;
    publicUrl: string;
    size: number;
    mimeType: string;
    category: UploadCategory;
    uploadedAt: Date;
}
export declare class UploadsService {
    private readonly companyModel;
    private readonly kycModel;
    private readonly configService;
    private readonly logger;
    private readonly uploadDir;
    private readonly s3Client;
    private readonly bucketName;
    private readonly region;
    private readonly publicBaseUrl?;
    private readonly allowedMimeTypes;
    private readonly sizeLimits;
    constructor(companyModel: Model<Company>, kycModel: Model<KYC>, configService: ConfigService);
    private ensureS3Configured;
    private ensureUploadDirectories;
    private validateFile;
    private generateObjectKey;
    private buildPublicUrl;
    private streamToBuffer;
    private extractObjectKey;
    private getLegacyLocalPathFromKey;
    private listAllObjects;
    uploadFile(file: Express.Multer.File, category: UploadCategory, metadata?: any): Promise<UploadResult>;
    uploadMultipleFiles(files: Express.Multer.File[], category: UploadCategory): Promise<UploadResult[]>;
    uploadCompanyDocument(companyId: string, file: Express.Multer.File, documentType: string): Promise<any>;
    uploadKYCDocuments(userId: string, frontImage: Express.Multer.File, backImage: Express.Multer.File): Promise<{
        frontImageUrl: string;
        backImageUrl: string;
    }>;
    uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<UploadResult>;
    getFile(category: UploadCategory, fileName: string): Promise<Buffer>;
    deleteFile(filePath: string): Promise<void>;
    deleteCompanyDocument(companyId: string, documentId: string): Promise<any>;
    deleteKYCDocuments(kycId: string): Promise<void>;
    getCompanyDocuments(companyId: string): Promise<any[]>;
    cleanupOrphanedFiles(): Promise<{
        deletedCount: number;
    }>;
    getStorageStats(): Promise<any>;
}
