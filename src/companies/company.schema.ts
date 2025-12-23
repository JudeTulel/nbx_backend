import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Document subdocument schema
@Schema({ _id: true, timestamps: false })
export class CompanyDocument {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  size: number;

  @Prop({ required: true })
  mimeType: string;

  @Prop({ type: Date, default: Date.now })
  uploadedAt: Date;
}

export const CompanyDocumentSchema = SchemaFactory.createForClass(CompanyDocument);

// Team member subdocument schema
@Schema({ _id: true, timestamps: false })
export class TeamMember {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  role: string;

  @Prop()
  bio?: string;

  @Prop()
  image?: string;
}

export const TeamMemberSchema = SchemaFactory.createForClass(TeamMember);

// Price history subdocument schema
@Schema({ _id: false, timestamps: false })
export class PriceHistory {
  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  price: number;
}

export const PriceHistorySchema = SchemaFactory.createForClass(PriceHistory);

// Main Company schema
@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  useremail: string;

  @Prop({ required: true, unique: true })
  ticker: string;

  @Prop({ required: true, unique: true })
  symbol: string;

  @Prop({ required: true })
  sector: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  marketCap: string;

  @Prop({ type: Number, default: 0 })
  price: number;

  @Prop({ default: '0' })
  totalSupply: string;

  @Prop({ default: '0' })
  circulatingSupply: string;

  // Documents array - properly typed as subdocuments
  @Prop({ type: [CompanyDocumentSchema], default: [] })
  documents: CompanyDocument[];

  @Prop({ type: [String], default: [] })
  highlights: string[];

  @Prop({ type: [TeamMemberSchema], default: [] })
  team: TeamMember[];

  @Prop({ type: [PriceHistorySchema], default: [] })
  priceHistory: PriceHistory[];

  // Hedera-related fields (optional)
  @Prop()
  tokenId?: string;

  @Prop()
  treasuryAccountId?: string;

  @Prop({ default: false })
  isTokenized: boolean;
}

export const CompanySchema = SchemaFactory.createForClass(Company);
