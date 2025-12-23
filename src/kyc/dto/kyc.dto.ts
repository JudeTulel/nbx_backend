import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  IsEnum, 
  IsOptional,
  MinLength,
  MaxLength,
  IsMongoId,
} from 'class-validator';
import { KYCDocumentType, KYCStatus } from '../kyc.schema';

export class SubmitKYCDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsEmail()
  @IsNotEmpty()
  useremail: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(50)
  idNumber: string;

  @IsEnum(KYCDocumentType)
  @IsOptional()
  documentType?: KYCDocumentType;
}

export class ReviewKYCDto {
  @IsEnum(KYCStatus)
  @IsNotEmpty()
  status: KYCStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsNotEmpty()
  reviewedBy: string;
}

export class KYCQueryDto {
  @IsEnum(KYCStatus)
  @IsOptional()
  status?: KYCStatus;

  @IsString()
  @IsOptional()
  useremail?: string;

  @IsMongoId()
  @IsOptional()
  userId?: string;
}