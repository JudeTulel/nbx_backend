import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  useremail: string;

  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ 
    required: true, 
    enum: ['investor', 'company', 'auditor', 'admin'],
    default: 'investor' 
  })
  role: string;

  @Prop({ required: true, unique: true })
  hederaAccountId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin?: Date;

  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: Date })
  updatedAt?: Date;

   @Prop({ default: null })
  kycStatus: string; // 'pending' | 'approved' | 'rejected' | null

  @Prop()
  kycSubmittedAt?: Date;

  @Prop()
  kycApprovedAt?: Date;

}

export const UserSchema = SchemaFactory.createForClass(User);