import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  hederaAccountId: string;

  @Prop({ required: true })
  hederaEVMAccount: string;

  // Define as a raw schema object
  @Prop({
    type: {
      encryptedKey: { type: String, required: true },
      salt: { type: String, required: true },
      iv: { type: String, required: true },
    },
    required: true,
  })
  encryptedWallet: {
    encryptedKey: string;
    salt: string;
    iv: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);