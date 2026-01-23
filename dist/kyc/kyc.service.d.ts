import { Model } from 'mongoose';
import { KYC } from './kyc.schema';
import { User } from '../users/users.schema';
import { SubmitKYCDto, ReviewKYCDto, KYCQueryDto } from './dto/kyc.dto';
export declare class KYCService {
    private kycModel;
    private userModel;
    private readonly logger;
    constructor(kycModel: Model<KYC>, userModel: Model<User>);
    submitKYC(dto: SubmitKYCDto, frontImageUrl: string, backImageUrl: string): Promise<KYC>;
    getKYCByUserId(userId: string): Promise<KYC>;
    getKYCByEmail(useremail: string): Promise<KYC>;
    getAllKYC(query: KYCQueryDto): Promise<KYC[]>;
    reviewKYC(id: string, dto: ReviewKYCDto): Promise<KYC>;
    deleteKYC(id: string): Promise<void>;
    isKYCApproved(userId: string): Promise<boolean>;
    private updateUserKYCStatus;
    getKYCStats(): Promise<any>;
}
