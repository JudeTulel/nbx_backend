import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ required: true, unique: true })
  ticker: string;

  @Prop({ required: true })
  sector: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  change: number;

  @Prop({ required: true })
  marketCap: string;

  @Prop({ required: true })
  volume: string;

  @Prop({ required: true })
  totalSupply: string;

  @Prop({ required: true })
  circulatingSupply: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  highlights: string[];

  @Prop({
    type: [
      {
        name: String,
        position: String,
      },
    ],
    default: [],
  })
  team: Array<{ name: string; position: string }>;

  @Prop({
    type: [
      {
        name: String,
        type: String,
        fileName: String,
        path: String,
        size: Number,
        mimeType: String,
        uploadedAt: Date,
      },
    ],
    default: [],
  })
  documents: Array<{
    name: string;
    type: string;
    fileName?: string;
    path?: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  }>;

  @Prop({
    type: [
      {
        date: String,
        price: Number,
      },
    ],
    default: [],
  })
  priceHistory: Array<{ date: string; price: number }>;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
