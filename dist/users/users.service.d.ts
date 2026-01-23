import { Model } from 'mongoose';
import { User } from './users.schema';
export declare class UserService {
    private userModel;
    private readonly logger;
    constructor(userModel: Model<User>);
    createUser(useremail: string, password: string, hederaAccountId: string, role?: string, isKYC?: boolean): Promise<User>;
    findOne(useremail: string): Promise<User>;
    findByHederaAccount(hederaAccountId: string): Promise<User>;
    updatePassword(useremail: string, currentPassword: string, newPassword: string): Promise<User>;
    updateUserRole(useremail: string, newRole: string): Promise<User>;
    login(useremail: string, password: string): Promise<User>;
    getUserProfile(useremail: string): Promise<Partial<User>>;
    deleteUser(useremail: string): Promise<void>;
}
