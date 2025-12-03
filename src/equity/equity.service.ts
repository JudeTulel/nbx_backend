import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HederaService } from '../hedera/hedera.service';
import { FactoryContractService } from '../hedera/contracts/factory.service';
import { ResolverContractService } from '../hedera/contracts/resolver.service';
import { Equity, EquityDocument } from './schemas/equity.schema';
import { CreateEquityDto } from './dto/create-equity.dto';
import { ContractFunctionParameters } from '@hashgraph/sdk';

@Injectable()
export class EquityService {
  private readonly logger = new Logger(EquityService.name);

  constructor(
    @InjectModel(Equity.name) private equityModel: Model<EquityDocument>,
    private readonly hederaService: HederaService,
    private readonly factoryService: FactoryContractService,
    private readonly resolverService: ResolverContractService
  ) {}

  async createEquity(createEquityDto: CreateEquityDto) {
    try {
      // 1. Create equity token on Hedera
      const result = await this.factoryService.createSecurityToken({
        name: createEquityDto.name,
        symbol: createEquityDto.symbol,
        decimals: 0, // Equity shares are whole units
        totalSupply: createEquityDto.totalSupply,
        tokenType: 'EQUITY',
        regulationType: createEquityDto.regulationType || 'REG_D',
        requireKYC: true
      });

      // 2. Set equity-specific parameters
      const equityParams = new ContractFunctionParameters()
        .addAddress(result.tokenId!)
        .addUint256(createEquityDto.dividendYield || 0)
        .addBool(createEquityDto.votingRights || false);

      await this.resolverService.executeContractFunction(
        'setEquityParameters',
        equityParams,
        500000
      );

      // 3. Save to MongoDB
      const equity = new this.equityModel({
        name: createEquityDto.name,
        symbol: createEquityDto.symbol,
        tokenId: result.tokenId,
        contractId: result.contractId,
        totalSupply: createEquityDto.totalSupply,
        dividendYield: createEquityDto.dividendYield,
        votingRights: createEquityDto.votingRights,
        companyId: createEquityDto.companyId,
        status: 'ACTIVE',
        createdAt: new Date()
      });

      await equity.save();

      this.logger.log(`Equity created: ${createEquityDto.symbol}`);

      return {
        success: true,
        equity,
        blockchain: result
      };
    } catch (error) {
      this.logger.error(`Failed to create equity: ${error?.message}`);
      throw error;
    }
  }

  async issueDividend(equityId: string, amountPerShare: string, recordDate: number) {
    const equity = await this.equityModel.findById(equityId);
    
    if (!equity) {
      throw new Error('Equity not found');
    }

    const params = new ContractFunctionParameters()
      .addAddress(equity.tokenId)
      .addUint256(amountPerShare)
      .addUint256(Math.floor(Date.now() / 1000))
      .addUint256(recordDate);

    const result = await this.resolverService.executeContractFunction(
      'issueDividend',
      params,
      2000000
    );

    // Update MongoDB
    equity.lastDividendPayment = new Date();
    await equity.save();

    return result;
  }

  async getEquityDetails(equityId: string) {
    return this.equityModel.findById(equityId);
  }

  async listEquities(filters?: any) {
    return this.equityModel.find(filters || {});
  }

  async findByCompany(companyId: string) {
    return this.equityModel.find({ companyId }).exec();
  }
}
