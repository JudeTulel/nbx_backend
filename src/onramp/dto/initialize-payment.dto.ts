import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
  Min,
  Max,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class PaymentMetadata {
  @IsString()
  @IsNotEmpty()
  orderID: string;
}

export class InitializePaymentDto {
  @IsEnum(['KESy_TESTNET'], {
    message: 'token must be KESy_TESTNET',
  })
  token: 'KESy_TESTNET';

  @IsNumber()
  @Min(1, { message: 'amount must be at least 1' })
  @Max(500000, { message: 'amount must not exceed 500,000' })
  amount: number;

  @IsEmail({}, { message: 'email must be a valid email address' })
  @IsNotEmpty({ message: 'email is required' })
  email: string;

  @IsOptional()
  @IsString()
  callback_url?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(
    [
      'card',
      'bank',
      'ussd',
      'qr',
      'mobile_money',
      'bank_transfer',
      'eft',
      'apple_pay',
      'payattitude',
    ],
    { each: true, message: 'Invalid payment channel' },
  )
  channels?: string[];

  @IsEnum(['KES'], {
    message: 'currency must be KES',
  })
  currency: 'KES';

  @IsOptional()
  @IsString()
  crypto_account?: string; // Hedera account ID (e.g., 0.0.7441630)

  @IsObject()
  @ValidateNested()
  @Type(() => PaymentMetadata)
  @IsNotEmpty({ message: 'metadata is required' })
  metadata: PaymentMetadata;
}