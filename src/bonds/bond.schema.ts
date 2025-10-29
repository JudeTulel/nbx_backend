import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Bond extends Document {
  @Prop({ required: true })
  companyId: string; // Reference to the company creating this bond

  @Prop({ required: true })
  diamondOwnerAccount: string; // Hedera id of the account deploying the security

  @Prop({ required: true })
  currency: string; // hexadecimal of the currency's 3 letter ISO code

  @Prop({ required: true })
  numberOfUnits: number; // maximum supply

  @Prop({ required: true })
  nominalValue: number; // value of a single bond

  @Prop({ required: true })
  startingDate: number; // Bond's starting date in seconds

  @Prop({ required: true })
  maturityDate: number; // Bond's maturity date in seconds

  @Prop({ required: true })
  regulationType: number; // 0: no regulation, 1: Reg S, 2: Reg D

  @Prop({ required: true })
  regulationSubType: number; // 0: no sub regulation, 1: 506 B, 2: 506 C

  @Prop({ required: true })
  isCountryControlListWhiteList: boolean;

  @Prop({ type: [String], default: [] })
  countries: string[]; // comma separated list of countries

  @Prop({ default: false })
  enableERC3643: boolean;

  @Prop({ type: [String], default: [] })
  complianceModules: string[];

  @Prop()
  identityRegistry: string;

  // Response fields from SDK
  @Prop()
  type: string; // "BOND"

  @Prop({ default: '0' })
  totalSupply: string;

  @Prop()
  maxSupply: string;

  @Prop()
  diamondAddress: string; // Hedera id of the deployed smart contract

  @Prop()
  evmDiamondAddress: string; // EVM address

  @Prop({ default: true })
  paused: boolean;

  @Prop({ type: Object })
  regulation: any; // RegulationViewModel

  @Prop()
  transactionId: string; // Id of the Hedera transaction

  // Additional fields for coupons
  @Prop({
    type: [
      {
        id: String,
        rate: Number,
        recordTimestamp: Number,
        executionTimestamp: Number,
        transactionId: String,
      },
    ],
    default: [],
  })
  coupons: Array<{
    id: string;
    rate: number;
    recordTimestamp: number;
    executionTimestamp: number;
    transactionId: string;
  }>;
}

export const BondSchema = SchemaFactory.createForClass(Bond);
