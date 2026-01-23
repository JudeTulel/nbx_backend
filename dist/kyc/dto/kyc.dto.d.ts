import { KYCDocumentType, KYCStatus } from '../kyc.schema';
export declare class SubmitKYCDto {
    userId: string;
    useremail: string;
    fullName: string;
    idNumber: string;
    documentType?: KYCDocumentType;
}
export declare class ReviewKYCDto {
    status: KYCStatus;
    rejectionReason?: string;
    reviewedBy: string;
}
export declare class KYCQueryDto {
    status?: KYCStatus;
    useremail?: string;
    userId?: string;
}
