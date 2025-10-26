export class UpdateCompanyDto {
  name?: string
  symbol?: string
  ticker?: string
  sector?: string
  price?: number
  change?: number
  marketCap?: string
  volume?: string
  totalSupply?: string
  circulatingSupply?: string
  description?: string
  highlights?: string[]
  team?: Array<{ name: string; position: string }>
  documents?: Array<{ name: string; type: string }>
  priceHistory?: Array<{ date: string; price: number }>
}
