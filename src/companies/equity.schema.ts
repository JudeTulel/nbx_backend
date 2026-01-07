import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Equity extends Document {
    // Reference to parent company
    @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
    companyId: Types.ObjectId;

    // Basic Info
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    symbol: string;

    @Prop()
    isin: string;

    @Prop({ type: Number, default: 4 })
    decimals: number;

    // Economic Info
    @Prop({ required: true })
    totalSupply: string;

    @Prop()
    nominalValue: string;

    @Prop({ default: 'USD' })
    currency: string;

    // Rights and Privileges
    @Prop({ type: Number, default: 0 })
    dividendYield: number;

    @Prop({ type: Number, default: 0 })
    dividendType: number;

    @Prop({ type: Boolean, default: false })
    votingRights: boolean;

    @Prop({ type: Boolean, default: false })
    informationRights: boolean;

    @Prop({ type: Boolean, default: false })
    liquidationRights: boolean;

    @Prop({ type: Boolean, default: false })
    subscriptionRights: boolean;

    @Prop({ type: Boolean, default: false })
    conversionRights: boolean;

    @Prop({ type: Boolean, default: false })
    redemptionRights: boolean;

    @Prop({ type: Boolean, default: false })
    putRight: boolean;

    // Configuration
    @Prop({ type: Boolean, default: true })
    isControllable: boolean;

    @Prop({ type: Boolean, default: true })
    isBlocklist: boolean;

    @Prop({ type: Boolean, default: false })
    isApprovalList: boolean;

    @Prop({ type: Boolean, default: false })
    clearingModeEnabled: boolean;

    @Prop({ type: Boolean, default: true })
    internalKycActivated: boolean;

    // Regulation
    @Prop()
    regulationType: string;

    @Prop()
    regulationSubType: string;

    // On-chain Details
    @Prop({ required: true })
    assetAddress: string;

    @Prop()
    diamondAddress: string;

    @Prop()
    transactionId: string;

    @Prop()
    treasuryAccountId: string;

    // Network
    @Prop({ default: 'testnet' })
    network: string;

    @Prop()
    companyName: string;

    // Status
    @Prop({ default: 'active' })
    status: string;

    @Prop({ type: Boolean, default: true })
    isTokenized: boolean;

    // Payment tokens accepted for purchasing this security
    // Default is KESy (0.0.7228867) - the platform's default payment token
    @Prop({ type: [String], default: ['0.0.7228867'] })
    paymentTokens: string[];

    @Prop()
    tokenizedAt: Date;
}

export const EquitySchema = SchemaFactory.createForClass(Equity);
