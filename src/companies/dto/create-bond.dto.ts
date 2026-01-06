import { IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateBondDto {
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
    faceValue?: string;

    @IsString()
    @IsOptional()
    nominalValue?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsNumber()
    couponRate: number;

    @IsNumber()
    @IsOptional()
    startingDate?: number;

    @IsNumber()
    maturityDate: number;

    @IsBoolean()
    @IsOptional()
    isControllable?: boolean;

    @IsBoolean()
    @IsOptional()
    isBlocklist?: boolean;

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
    issuer?: string;

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
