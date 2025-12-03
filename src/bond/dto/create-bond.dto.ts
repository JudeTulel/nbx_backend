import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateBondDto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsString()
  totalSupply: string;

  @IsString()
  companyId: string;

  @IsNumber()
  @Min(0)
  maturityDate: number; // Unix timestamp

  @IsNumber()
  @Min(0)
  couponRate: number; // Basis points (e.g., 450 = 4.50%)

  @IsString()
  faceValue: string;

  @IsString()
  issuer: string; // Company/SME ID

  @IsOptional()
  @IsString()
  regulationType?: 'REG_D' | 'REG_S' | 'REG_CF';
}
