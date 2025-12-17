import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  ticker: string;

  @IsString()
  @IsNotEmpty()
  sector: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  marketCap: string;

  @IsString()
  @IsOptional()
  price?: string;

  @IsString()
  @IsNotEmpty()
  useremail: string;

  // Files will be attached via Express.Multer.File (handled in controller)
  certificateOfIncorporation?: Express.Multer.File;
  cr12?: Express.Multer.File;
  memArts?: Express.Multer.File;
  otherDocs?: Express.Multer.File[];

  // Optional fields for completeness
  @IsOptional()
  highlights?: string[];

  @IsOptional()
  team?: Array<{ name: string; position: string }>;

  @IsOptional()
  priceHistory?: Array<{ date: string; price: number }>;
}
