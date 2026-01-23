import { Document } from 'mongoose';
export declare class User extends Document {
    useremail: string;
    passwordHash: string;
    role: string;
    hederaAccountId: string;
    isActive: boolean;
    lastLogin?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    kycStatus: string;
    kycSubmittedAt?: Date;
    kycApprovedAt?: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
