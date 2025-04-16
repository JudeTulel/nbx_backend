import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop()
  hederaAccountId: string;
  
  @Prop()
  hederaEVMAccount: string;

  @Prop()
  encryptedWallet: {
    encryptedKey: string;
    salt: string;
    iv: string;
  };
}

export const UserSchema = SchemaFactory.createForClass(User);
