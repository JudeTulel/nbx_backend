import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Bond extends Document {
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

    @Prop({ type: Number, default: 0 })
    decimals: number;

    // Bond Economics
    @Prop({ required: true })
    totalSupply: string;

    @Prop()
    faceValue: string;

    @Prop()
    nominalValue: string;

    @Prop({ default: 'USD' })
    currency: string;

    @Prop({ type: Number, required: true })
    couponRate: number;

    @Prop({ type: Number })
    startingDate: number; // Unix timestamp

    @Prop({ type: Number, required: true })
    maturityDate: number; // Unix timestamp

    // Configuration
    @Prop({ type: Boolean, default: true })
    isControllable: boolean;

    @Prop({ type: Boolean, default: true })
    isBlocklist: boolean;

    @Prop({ type: Boolean, default: false })
    clearingModeEnabled: boolean;

    @Prop({ type: Boolean, default: false })
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

    // Issuer Info
    @Prop()
    issuer: string;

    @Prop()
    companyName: string;

    // Network
    @Prop({ default: 'testnet' })
    network: string;

    // Status
    @Prop({ default: 'active' })
    status: string;

    @Prop({ type: Boolean, default: true })
    isTokenized: boolean;

    @Prop()
    tokenizedAt: Date;
}

export const BondSchema = SchemaFactory.createForClass(Bond);
