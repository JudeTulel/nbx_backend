import type { Response } from 'express';
import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadCompanyDocument(companyId: string, file: Express.Multer.File, documentType: string): Promise<any>;
    uploadKYCDocuments(userId: string, files: {
        frontImage?: Express.Multer.File[];
        backImage?: Express.Multer.File[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            frontImageUrl: string;
            backImageUrl: string;
        };
    }>;
    uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: import("./uploads.service").UploadResult;
    }>;
    getFile(category: string, fileName: string, res: Response): Promise<void>;
    downloadFile(category: string, fileName: string, res: Response): Promise<void>;
    getCompanyDocuments(companyId: string): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
    deleteCompanyDocument(companyId: string, documentId: string): Promise<any>;
    getStorageStats(): Promise<{
        success: boolean;
        data: any;
    }>;
    cleanupOrphanedFiles(): Promise<{
        success: boolean;
        message: string;
        data: {
            deletedCount: number;
        };
    }>;
}
