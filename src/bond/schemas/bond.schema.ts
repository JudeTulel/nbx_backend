import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BondDocument = Bond & Document;

@Schema()
export class Bond {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ required: true })
  tokenId: string; // Hedera token ID

  @Prop({ required: true })
  contractId: string; // Smart contract ID

  @Prop({ required: true })
  totalSupply: string;

  @Prop({ required: true })
  maturityDate: Date;

  @Prop({ required: true })
  couponRate: number;

  @Prop({ required: true })
  faceValue: string;

  @Prop({ required: true })
  issuer: string;

  @Prop({ default: 'ACTIVE' })
  status: string;

  @Prop()
  lastCouponPayment?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const BondSchema = SchemaFactory.createForClass(Bond);
