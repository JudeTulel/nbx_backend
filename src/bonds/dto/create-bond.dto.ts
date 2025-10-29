import {
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateBondDto {
  @IsString()
  companyId: string;

  @IsString()
  diamondOwnerAccount: string;

  @IsString()
  currency: string;

  @IsNumber()
  numberOfUnits: number;

  @IsNumber()
  nominalValue: number;

  @IsNumber()
  startingDate: number;

  @IsNumber()
  maturityDate: number;

  @IsNumber()
  regulationType: number;

  @IsNumber()
  regulationSubType: number;

  @IsBoolean()
  isCountryControlListWhiteList: boolean;

  @IsArray()
  @IsString({ each: true })
  countries: string[];

  @IsOptional()
  @IsBoolean()
  enableERC3643?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  complianceModules?: string[];

  @IsOptional()
  @IsString()
  identityRegistry?: string;
}

export class SetCouponDto {
  @IsString()
  securityId: string;

  @IsNumber()
  rate: number;

  @IsNumber()
  recordTimestamp: number;

  @IsNumber()
  executionTimestamp: number;
}
