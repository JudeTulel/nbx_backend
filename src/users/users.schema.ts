import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Sub-schema for encryptedWallet
@Schema()
export class EncryptedWallet {
  @Prop({ type: String, required: true })
  encryptedKey: string;

  @Prop({ type: String, required: true })
  salt: string;

  @Prop({ type: String, required: true })
  iv: string;
}

// Main User schema
@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  hederaAccountId: string;

  @Prop({ required: true })
  hederaEVMAccount: string;

  @Prop({ type: EncryptedWallet, required: true })
  encryptedWallet: EncryptedWallet;
}

export const UserSchema = SchemaFactory.createForClass(User);