// encrypted-wallet.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class EncryptedWallet {
  @Prop({ required: true })
  encryptedKey: string;

  @Prop({ required: true })
  salt: string;

  @Prop({ required: true })
  iv: string;
}

export type EncryptedWalletDocument = HydratedDocument<EncryptedWallet>;
export const EncryptedWalletSchema =
  SchemaFactory.createForClass(EncryptedWallet);
