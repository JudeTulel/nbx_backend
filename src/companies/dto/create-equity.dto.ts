import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateEquityDto {
    @IsString()
    name: string;

    @IsString()
    symbol: string;

    @IsString()
    @IsOptional()
    isin?: string;

    @IsNumber()
    @IsOptional()
    decimals?: number;

    @IsString()
    totalSupply: string;

    @IsString()
    @IsOptional()
    nominalValue?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsNumber()
    @IsOptional()
    dividendYield?: number;

    @IsNumber()
    @IsOptional()
    dividendType?: number;

    @IsBoolean()
    @IsOptional()
    votingRights?: boolean;

    @IsBoolean()
    @IsOptional()
    informationRights?: boolean;

    @IsBoolean()
    @IsOptional()
    liquidationRights?: boolean;

    @IsBoolean()
    @IsOptional()
    subscriptionRights?: boolean;

    @IsBoolean()
    @IsOptional()
    conversionRights?: boolean;

    @IsBoolean()
    @IsOptional()
    redemptionRights?: boolean;

    @IsBoolean()
    @IsOptional()
    putRight?: boolean;

    @IsBoolean()
    @IsOptional()
    isControllable?: boolean;

    @IsBoolean()
    @IsOptional()
    isBlocklist?: boolean;

    @IsBoolean()
    @IsOptional()
    isApprovalList?: boolean;

    @IsBoolean()
    @IsOptional()
    clearingModeEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    internalKycActivated?: boolean;

    @IsString()
    @IsOptional()
    regulationType?: string;

    @IsString()
    @IsOptional()
    regulationSubType?: string;

    @IsString()
    assetAddress: string;

    @IsString()
    @IsOptional()
    diamondAddress?: string;

    @IsString()
    @IsOptional()
    transactionId?: string;

    @IsString()
    @IsOptional()
    treasuryAccountId?: string;

    @IsString()
    @IsOptional()
    companyName?: string;

    @IsString()
    @IsOptional()
    network?: string;

    @IsString()
    @IsOptional()
    status?: string;

    @IsBoolean()
    @IsOptional()
    isTokenized?: boolean;

    @IsString()
    @IsOptional()
    tokenizedAt?: string;
}
