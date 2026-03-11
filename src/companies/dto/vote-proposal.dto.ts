import { IsIn, IsString, IsOptional } from 'class-validator';

export class VoteProposalDto {
  @IsString()
  @IsIn(['for', 'against'])
  vote: 'for' | 'against';

  @IsOptional()
  @IsString()
  voterAccountId?: string;

  @IsOptional()
  @IsString()
  voterEmail?: string;
}
