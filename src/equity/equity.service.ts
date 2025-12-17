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
      this.logger.log(`[EQUITY] Starting createEquity for ${createEquityDto.symbol}`);
      this.logger.log(`[EQUITY] DTO: ${JSON.stringify(createEquityDto)}`);

      // 1. Create equity token on Hedera
      this.logger.log(`[EQUITY] Step 1: Creating security token on Hedera...`);
      let result;
      try {
        result = await this.factoryService.createSecurityToken({
          name: createEquityDto.name,
          symbol: createEquityDto.symbol,
          decimals: 0, // Equity shares are whole units
          totalSupply: createEquityDto.totalSupply,
          tokenType: 'EQUITY',
          regulationType: createEquityDto.regulationType || 'REG_D',
          requireKYC: true,
          companyAccountId: createEquityDto.companyAccountId // Pass company account for signing
        });
        this.logger.log(`[EQUITY] Security token created successfully`);
        this.logger.log(`[EQUITY] Token result: ${JSON.stringify(result)}`);
      } catch (error: any) {
        this.logger.error(`[EQUITY] FAILED to create security token: ${error?.message}`);
        this.logger.error(`[EQUITY] Error: ${JSON.stringify(error)}`);
        throw new Error(`Failed to create security token: ${error?.message}`);
      }

      // 2. Set equity-specific parameters
      this.logger.log(`[EQUITY] Step 2: Setting equity parameters...`);
      try {
        const equityParams = new ContractFunctionParameters()
          .addAddress(result.tokenId!)
          .addUint256(createEquityDto.dividendYield || 0)
          .addBool(createEquityDto.votingRights || false);

        this.logger.log(`[EQUITY] Equity parameters created: tokenId=${result.tokenId}, dividendYield=${createEquityDto.dividendYield}, votingRights=${createEquityDto.votingRights}`);

        const paramResult = await this.resolverService.executeContractFunction(
          'setEquityParameters',
          equityParams,
          500000
        );
        this.logger.log(`[EQUITY] Equity parameters set successfully`);
        this.logger.log(`[EQUITY] Param result: ${JSON.stringify(paramResult)}`);
      } catch (error: any) {
        this.logger.error(`[EQUITY] FAILED to set equity parameters: ${error?.message}`);
        this.logger.error(`[EQUITY] Error: ${JSON.stringify(error)}`);
        throw new Error(`Failed to set equity parameters: ${error?.message}`);
      }

      // 3. Save to MongoDB
      this.logger.log(`[EQUITY] Step 3: Saving equity to MongoDB...`);
      try {
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
        this.logger.log(`[EQUITY] Equity saved to MongoDB successfully`);

        this.logger.log(`Equity created: ${createEquityDto.symbol}`);

        return {
          success: true,
          equity,
          blockchain: result
        };
      } catch (error: any) {
        this.logger.error(`[EQUITY] FAILED to save equity to MongoDB: ${error?.message}`);
        this.logger.error(`[EQUITY] Error: ${JSON.stringify(error)}`);
        throw new Error(`Failed to save equity to MongoDB: ${error?.message}`);
      }
    } catch (error: any) {
      this.logger.error(`[EQUITY] CRITICAL ERROR in createEquity: ${error?.message}`);
      this.logger.error(`[EQUITY] Stack: ${error?.stack}`);
      throw error;
    }
  }

  async issueDividend(equityId: string, amountPerShare: string, recordDate: number) {
    try {
      this.logger.log(`[EQUITY] Starting issueDividend for equityId=${equityId}, amountPerShare=${amountPerShare}`);
      
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

      this.logger.log(`[EQUITY] Dividend issued successfully for equityId=${equityId}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[EQUITY] ERROR in issueDividend: ${error?.message}`);
      throw error;
    }
  }

  async getEquityDetails(equityId: string) {
    try {
      this.logger.log(`[EQUITY] Getting equity details for equityId=${equityId}`);
      return this.equityModel.findById(equityId);
    } catch (error: any) {
      this.logger.error(`[EQUITY] ERROR in getEquityDetails: ${error?.message}`);
      throw error;
    }
  }

  async listEquities(filters?: any) {
    try {
      this.logger.log(`[EQUITY] Listing equities with filters: ${JSON.stringify(filters)}`);
      return this.equityModel.find(filters || {});
    } catch (error: any) {
      this.logger.error(`[EQUITY] ERROR in listEquities: ${error?.message}`);
      throw error;
    }
  }

  async findByCompany(companyId: string) {
    try {
      this.logger.log(`[EQUITY] Finding equities for companyId=${companyId}`);
      return this.equityModel.find({ companyId }).exec();
    } catch (error: any) {
      this.logger.error(`[EQUITY] ERROR in findByCompany: ${error?.message}`);
      throw error;
    }
  }
}
