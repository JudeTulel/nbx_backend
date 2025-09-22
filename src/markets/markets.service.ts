import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { ContractsService } from '../contracts/contracts.service';

@Injectable()
export class MarketsService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private contractsService: ContractsService
  ) {}

  // Get all listed companies for the marketplace
  async getListedCompanies() {
    return await this.companyModel.find({ listingStatus: true }).exec();
  }

  // Get detailed market information for a specific company
  async getCompanyMarketInfo(companyName: string) {
    const company = await this.companyModel.findOne({ 
      companyName, 
      listingStatus: true 
    }).exec();
    
    if (!company) {
      throw new Error('Company not found or not listed');
    }

    // Get the exchange contract address
    const exchangeAddress = await this.contractsService.getSMEContract(companyName);
    
    if (exchangeAddress === '0x0000000000000000000000000000000000000000') {
      throw new Error('Company has no deployed exchange contract');
    }

    // Get the security token address from the exchange contract
    const exchange = this.contractsService.getExchangeContract(exchangeAddress);
    const securityTokenAddress = await exchange.securityTokenAddress();
    
    // Get token supply and other market data
    const totalSupply = await this.contractsService.getTotalTokenSupply(
      exchangeAddress, 
      securityTokenAddress
    );
    
    const treasuryBalance = await this.contractsService.getTokenBalance(
      exchangeAddress,
      securityTokenAddress,
      company.tresuaryAddress
    );
    
    const circulatingSupply = BigInt(totalSupply) - BigInt(treasuryBalance);
    
    // Get dividend information
    const totalDividends = await this.contractsService.getTotalDividendsDistributed(exchangeAddress);

    return {
      companyName: company.companyName,
      registrationNumber: company.RegistrationNumber,
      exchangeAddress,
      securityTokenAddress,
      totalSupply,
      treasuryBalance,
      circulatingSupply: circulatingSupply.toString(),
      totalDividendsDistributed: totalDividends,
      // Market metrics could be expanded with price data from liquidity pools
    };
  }

  // Get market overview with summary of all listed companies
  async getMarketOverview() {
    const listedCompanies = await this.getListedCompanies();
    const marketData: Array<{
      companyName: string;
      exchangeAddress: any;
      securityTokenAddress: any;
      totalSupply: any;
      otherMetrics: {};
    }> = [];
    
    for (const company of listedCompanies) {
      try {
        const exchangeAddress = await this.contractsService.getSMEContract(company.companyName);
        
        if (exchangeAddress === '0x0000000000000000000000000000000000000000') {
          continue;
        }
        
        const exchange = this.contractsService.getExchangeContract(exchangeAddress);
        const securityTokenAddress = await exchange.securityTokenAddress();
        
        const totalSupply = await this.contractsService.getTotalTokenSupply(
          exchangeAddress, 
          securityTokenAddress
        );
        
        marketData.push({
          companyName: company.companyName,
          exchangeAddress,
          securityTokenAddress,
          totalSupply,
          otherMetrics: {}  // Added missing property
          // Additional market metrics could be added here
        });
      } catch (error) {
        console.error(`Error fetching market data for ${company.companyName}:`, error);
        // Continue with next company if there's an error
      }
    }
    
    return marketData;
  }

  // Get trading volume and activity for a specific company
  async getCompanyTradingActivity(companyName: string) {
    // This would typically connect to an event indexer or subgraph
    // For now, we'll return a placeholder implementation
    const company = await this.companyModel.findOne({ 
      companyName, 
      listingStatus: true 
    }).exec();
    
    if (!company) {
      throw new Error('Company not found or not listed');
    }

    // Get the exchange contract address
    const exchangeAddress = await this.contractsService.getSMEContract(companyName);
    
    // In a real implementation, we would query historical events from the blockchain
    // or from an indexed database of transfer events
    
    return {
      companyName: company.companyName,
      exchangeAddress,
      tradingVolume24h: "0", // Placeholder
      numberOfTransactions24h: 0, // Placeholder
      // Additional trading metrics would be added here
    };
  }

  // Search for companies in the marketplace
  async searchMarket(searchTerm: string) {
    return await this.companyModel.find({
      listingStatus: true,
      $or: [
        { companyName: { $regex: searchTerm, $options: 'i' } },
        { RegistrationNumber: { $regex: searchTerm, $options: 'i' } },
      ]
    }).exec();
  }
}