export class CreateCompanyDto {
  name: string;
  useremail : string;
  symbol: string;
  ticker: string;
  sector: string;
  price: number;
  change: number;
  marketCap: string;
  volume: string;
  totalSupply: string;
  circulatingSupply: string;
  description: string;
  highlights?: string[];
  team?: Array<{ name: string; position: string }>;
  documents?: Array<{
    name: string;
    type: string;
    fileName?: string;
    path?: string;
    size?: number;
    mimeType?: string;
    uploadedAt?: Date;
  }>;
  priceHistory?: Array<{ date: string; price: number }>;
}
