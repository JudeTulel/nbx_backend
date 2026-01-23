import { Document } from 'mongoose';
export declare class CompanyDocument {
    name: string;
    type: string;
    fileName: string;
    path: string;
    url: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
}
export declare const CompanyDocumentSchema: import("mongoose").Schema<CompanyDocument, import("mongoose").Model<CompanyDocument, any, any, any, Document<unknown, any, CompanyDocument, any, {}> & CompanyDocument & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CompanyDocument, Document<unknown, {}, import("mongoose").FlatRecord<CompanyDocument>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<CompanyDocument> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class TeamMember {
    name: string;
    role: string;
    bio?: string;
    image?: string;
}
export declare const TeamMemberSchema: import("mongoose").Schema<TeamMember, import("mongoose").Model<TeamMember, any, any, any, Document<unknown, any, TeamMember, any, {}> & TeamMember & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TeamMember, Document<unknown, {}, import("mongoose").FlatRecord<TeamMember>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<TeamMember> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class PriceHistory {
    date: string;
    price: number;
}
export declare const PriceHistorySchema: import("mongoose").Schema<PriceHistory, import("mongoose").Model<PriceHistory, any, any, any, Document<unknown, any, PriceHistory, any, {}> & PriceHistory & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, PriceHistory, Document<unknown, {}, import("mongoose").FlatRecord<PriceHistory>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<PriceHistory> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export declare class Company extends Document {
    name: string;
    useremail: string;
    ticker: string;
    symbol: string;
    sector: string;
    description: string;
    marketCap: string;
    price: number;
    totalSupply: string;
    circulatingSupply: string;
    documents: CompanyDocument[];
    highlights: string[];
    team: TeamMember[];
    priceHistory: PriceHistory[];
    tokenId?: string;
    treasuryAccountId?: string;
    isTokenized: boolean;
}
export declare const CompanySchema: import("mongoose").Schema<Company, import("mongoose").Model<Company, any, any, any, Document<unknown, any, Company, any, {}> & Company & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Company, Document<unknown, {}, import("mongoose").FlatRecord<Company>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Company> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
