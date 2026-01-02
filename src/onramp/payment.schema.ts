import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  reference: string;

  @Prop({ required: true })
  orderID: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop({ required: true })
  token: string;

  @Prop({ required: true, default: 'PENDING' })
  status: string; // PENDING, SUCCESS, FAILED

  @Prop({ required: true })
  authorizationUrl: string;

  @Prop({ required: true })
  accessCode: string;

  @Prop()
  cryptoAccount?: string; // Hedera account ID where tokens will be sent

  @Prop({ type: Object })
  webhookData?: any; // Store webhook payload

  @Prop({ default: Date.now })
  createdAt: Date;
  @Prop({ default: Date.now })
  completedAt?: Date;

  @Prop({ default: Date.now })
  failedAt?: Date;

  @Prop()
  updatedAt?: Date;
   @Prop()
  initiatedBy?: string; // User emailwho initiated the payment
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);