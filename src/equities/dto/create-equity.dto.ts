import {
  IsBoolean,
  IsNumber,
  IsString,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateEquityDto {
  @IsString()
  companyId: string;

  @IsString()
  diamondOwnerAccount: string;

  @IsBoolean()
  votingRight: boolean;

  @IsBoolean()
  informationRight: boolean;

  @IsBoolean()
  liquidationRight: boolean;

  @IsBoolean()
  subscriptionRight: boolean;

  @IsBoolean()
  conversionRight: boolean;

  @IsBoolean()
  redemptionRight: boolean;

  @IsBoolean()
  putRight: boolean;

  @IsBoolean()
  dividendRight: boolean;

  @IsString()
  currency: string;

  @IsNumber()
  numberOfShares: number;

  @IsNumber()
  nominalValue: number;

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

export class SetDividendDto {
  @IsString()
  securityId: string;

  @IsNumber()
  amountPerUnitOfSecurity: number;

  @IsNumber()
  recordTimestamp: number;

  @IsNumber()
  executionTimestamp: number;
}

export class SetVotingRightsDto {
  @IsString()
  securityId: string;

  @IsNumber()
  recordTimestamp: number;

  @IsString()
  data: string;
}
