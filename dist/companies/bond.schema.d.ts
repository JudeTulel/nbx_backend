import { Document, Types } from 'mongoose';
export declare class Bond extends Document {
    companyId: Types.ObjectId;
    name: string;
    symbol: string;
    isin: string;
    decimals: number;
    totalSupply: string;
    faceValue: string;
    nominalValue: string;
    currency: string;
    couponRate: number;
    startingDate: number;
    maturityDate: number;
    isControllable: boolean;
    isBlocklist: boolean;
    clearingModeEnabled: boolean;
    internalKycActivated: boolean;
    regulationType: string;
    regulationSubType: string;
    assetAddress: string;
    diamondAddress: string;
    transactionId: string;
    treasuryAccountId: string;
    issuer: string;
    companyName: string;
    network: string;
    status: string;
    isTokenized: boolean;
    paymentTokens: string[];
    tokenizedAt: Date;
}
export declare const BondSchema: import("mongoose").Schema<Bond, import("mongoose").Model<Bond, any, any, any, Document<unknown, any, Bond, any, {}> & Bond & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Bond, Document<unknown, {}, import("mongoose").FlatRecord<Bond>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Bond> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
