import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum KYCStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum KYCDocumentType {
  PASSPORT = 'passport',
  DRIVERS_LICENSE = 'drivers_license',
  NATIONAL_ID = 'national_id',
}

@Schema({ timestamps: true })
export class KYC extends Document {
  // PRIMARY LINK: Use MongoDB ObjectId reference
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // SECONDARY LINK: Keep email for convenience (not unique in case user changes email)
  @Prop({ required: true, index: true })
  useremail: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  idNumber: string;

  @Prop({ 
    type: String, 
    enum: KYCDocumentType,
    default: KYCDocumentType.NATIONAL_ID 
  })
  documentType: KYCDocumentType;

  @Prop({ required: true })
  frontImageUrl: string;

  @Prop({ required: true })
  backImageUrl: string;

  @Prop({ 
    type: String, 
    enum: KYCStatus, 
    default: KYCStatus.PENDING 
  })
  status: KYCStatus;

  @Prop()
  rejectionReason?: string;

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  expiresAt?: Date;

  @Prop()
  submittedAt: Date;
}

export const KYCSchema = SchemaFactory.createForClass(KYC);

// Create compound index for efficient queries
KYCSchema.index({ userId: 1, status: 1 });