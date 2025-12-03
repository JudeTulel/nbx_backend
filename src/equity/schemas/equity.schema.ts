import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EquityDocument = Equity & Document;

@Schema()
export class Equity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ required: true })
  tokenId: string;

  @Prop({ required: true })
  contractId: string;

  @Prop({ required: true })
  totalSupply: string;

  @Prop()
  dividendYield?: number;

  @Prop({ default: false })
  votingRights: boolean;

  @Prop({ required: true })
  companyId: string;

  @Prop({ default: 'ACTIVE' })
  status: string;

  @Prop()
  lastDividendPayment?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const EquitySchema = SchemaFactory.createForClass(Equity);
