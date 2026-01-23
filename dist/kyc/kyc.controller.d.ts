import { KYCService } from './kyc.service';
import { UploadsService } from '../uploads/uploads.service';
import { SubmitKYCDto, ReviewKYCDto, KYCQueryDto } from './dto/kyc.dto';
export declare class KYCController {
    private readonly kycService;
    private readonly uploadsService;
    constructor(kycService: KYCService, uploadsService: UploadsService);
    submitKYC(dto: SubmitKYCDto, files: {
        frontImage?: Express.Multer.File[];
        backImage?: Express.Multer.File[];
    }): Promise<{
        success: boolean;
        message: string;
        data: import("./kyc.schema").KYC;
    }>;
    getKYCStatusByUserId(userId: string): Promise<{
        success: boolean;
        data: import("./kyc.schema").KYC;
    }>;
    getKYCStatusByEmail(email: string): Promise<{
        success: boolean;
        data: import("./kyc.schema").KYC;
    }>;
    checkKYCApproval(userId: string): Promise<{
        success: boolean;
        isApproved: boolean;
    }>;
    getAllKYC(query: KYCQueryDto): Promise<{
        success: boolean;
        count: number;
        data: import("./kyc.schema").KYC[];
    }>;
    getKYCStats(): Promise<{
        success: boolean;
        data: any;
    }>;
    reviewKYC(id: string, dto: ReviewKYCDto): Promise<{
        success: boolean;
        message: string;
        data: import("./kyc.schema").KYC;
    }>;
    deleteKYC(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
