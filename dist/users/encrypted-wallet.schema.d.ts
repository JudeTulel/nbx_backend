import { HydratedDocument } from 'mongoose';
export declare class EncryptedWallet {
    encryptedKey: string;
    salt: string;
    iv: string;
}
export type EncryptedWalletDocument = HydratedDocument<EncryptedWallet>;
export declare const EncryptedWalletSchema: import("mongoose").Schema<EncryptedWallet, import("mongoose").Model<EncryptedWallet, any, any, any, import("mongoose").Document<unknown, any, EncryptedWallet, any, {}> & EncryptedWallet & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EncryptedWallet, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<EncryptedWallet>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<EncryptedWallet> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
