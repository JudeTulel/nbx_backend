// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { EncryptedWallet } from './encrypted-wallet.schema'; // Import the new class

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  // @Prop({ required: true, unique: true, auto: true })
  // _id: string;
  
  @Prop({ required: true, unique: true })
  username: string;
  
  @Prop({ required: true })
  passwordHash: string;
  
  @Prop({ required: true, default: 'user' })
  role: string;
  
  @Prop()
  hederaAccountId: string;
  
  @Prop()
  hederaEVMAccount: string;
  
  @Prop({
    type: MongooseSchema.Types.Mixed, // Use mixed type for dynamic content
    default: undefined,
  })
  encryptedWallet?: EncryptedWallet; // Use optional property
}

export const UserSchema = SchemaFactory.createForClass(User);