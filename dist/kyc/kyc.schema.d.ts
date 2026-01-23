import { Document, Types } from 'mongoose';
export declare enum KYCStatus {
    PENDING = "pending",
    UNDER_REVIEW = "under_review",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXPIRED = "expired"
}
export declare enum KYCDocumentType {
    PASSPORT = "passport",
    DRIVERS_LICENSE = "drivers_license",
    NATIONAL_ID = "national_id"
}
export declare class KYC extends Document {
    userId: Types.ObjectId;
    useremail: string;
    fullName: string;
    idNumber: string;
    documentType: KYCDocumentType;
    frontImageUrl: string;
    backImageUrl: string;
    status: KYCStatus;
    rejectionReason?: string;
    reviewedBy?: string;
    reviewedAt?: Date;
    expiresAt?: Date;
    submittedAt: Date;
}
export declare const KYCSchema: import("mongoose").Schema<KYC, import("mongoose").Model<KYC, any, any, any, Document<unknown, any, KYC, any, {}> & KYC & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, KYC, Document<unknown, {}, import("mongoose").FlatRecord<KYC>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<KYC> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
