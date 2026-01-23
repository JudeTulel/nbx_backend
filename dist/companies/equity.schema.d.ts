import { Document, Types } from 'mongoose';
export declare class Equity extends Document {
    companyId: Types.ObjectId;
    name: string;
    symbol: string;
    isin: string;
    decimals: number;
    totalSupply: string;
    nominalValue: string;
    currency: string;
    dividendYield: number;
    dividendType: number;
    votingRights: boolean;
    informationRights: boolean;
    liquidationRights: boolean;
    subscriptionRights: boolean;
    conversionRights: boolean;
    redemptionRights: boolean;
    putRight: boolean;
    isControllable: boolean;
    isBlocklist: boolean;
    isApprovalList: boolean;
    clearingModeEnabled: boolean;
    internalKycActivated: boolean;
    regulationType: string;
    regulationSubType: string;
    assetAddress: string;
    diamondAddress: string;
    transactionId: string;
    treasuryAccountId: string;
    network: string;
    companyName: string;
    status: string;
    isTokenized: boolean;
    paymentTokens: string[];
    tokenizedAt: Date;
}
export declare const EquitySchema: import("mongoose").Schema<Equity, import("mongoose").Model<Equity, any, any, any, Document<unknown, any, Equity, any, {}> & Equity & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Equity, Document<unknown, {}, import("mongoose").FlatRecord<Equity>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Equity> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
