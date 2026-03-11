import { IsMongoId, IsOptional, IsString, MinLength, IsDateString } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsString()
  @IsOptional()
  proposalType?: string;

  @IsDateString()
  endDate: string;

  @IsMongoId()
  @IsOptional()
  equityId?: string;
}

