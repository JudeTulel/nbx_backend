import { IsString, IsNumber, IsBoolean, IsOptional, Min } from 'class-validator';

export class CreateEquityDto {
  @IsString()
  name: string;

  @IsString()
  symbol: string;

  @IsString()
  totalSupply: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  dividendYield?: number;

  @IsOptional()
  @IsBoolean()
  votingRights?: boolean;

  @IsString()
  companyId: string; // SME company ID

  @IsOptional()
  @IsString()
  regulationType?: 'REG_D' | 'REG_S' | 'REG_CF';
}
