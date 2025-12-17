import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HederaService } from '../hedera/hedera.service';
import { FactoryContractService } from '../hedera/contracts/factory.service';
import { ResolverContractService } from '../hedera/contracts/resolver.service';
import { Bond, BondDocument } from './schemas/bond.schema';
import { CreateBondDto } from './dto/create-bond.dto';
import { ContractFunctionParameters } from '@hashgraph/sdk';

@Injectable()
export class BondService {
  private readonly logger = new Logger(BondService.name);

  constructor(
    @InjectModel(Bond.name) private bondModel: Model<BondDocument>,
    private readonly hederaService: HederaService,
    private readonly factoryService: FactoryContractService,
    private readonly resolverService: ResolverContractService
  ) {}

  async createBond(createBondDto: CreateBondDto) {
    try {
      this.logger.log(`[BOND] Starting createBond for ${createBondDto.symbol}`);
      this.logger.log(`[BOND] DTO: ${JSON.stringify(createBondDto)}`);

      // 1. Create bond token on Hedera
      this.logger.log(`[BOND] Step 1: Creating security token on Hedera...`);
      let result;
      try {
        result = await this.factoryService.createSecurityToken({
          name: createBondDto.name,
          symbol: createBondDto.symbol,
          decimals: 2, // Bonds typically use 2 decimals
          totalSupply: createBondDto.totalSupply,
          tokenType: 'BOND',
          regulationType: createBondDto.regulationType || 'REG_S',
          requireKYC: true,
          companyAccountId: createBondDto.companyAccountId // Pass company account for signing
        });
        this.logger.log(`[BOND] Security token created successfully`);
        this.logger.log(`[BOND] Token result: ${JSON.stringify(result)}`);
      } catch (error: any) {
        this.logger.error(`[BOND] FAILED to create security token: ${error?.message}`);
        this.logger.error(`[BOND] Error: ${JSON.stringify(error)}`);
        throw new Error(`Failed to create security token: ${error?.message}`);
      }

      // 2. Set bond-specific parameters
      this.logger.log(`[BOND] Step 2: Setting bond parameters...`);
      try {
        const bondParams = new ContractFunctionParameters()
          .addAddress(result.tokenId!)
          .addUint256(createBondDto.maturityDate)
          .addUint256(createBondDto.couponRate)
          .addUint256(createBondDto.faceValue);

        this.logger.log(`[BOND] Bond parameters created: tokenId=${result.tokenId}, maturityDate=${createBondDto.maturityDate}, couponRate=${createBondDto.couponRate}, faceValue=${createBondDto.faceValue}`);

        const paramResult = await this.resolverService.executeContractFunction(
          'setBondParameters',
          bondParams,
          500000
        );
        this.logger.log(`[BOND] Bond parameters set successfully`);
        this.logger.log(`[BOND] Param result: ${JSON.stringify(paramResult)}`);
      } catch (error: any) {
        this.logger.error(`[BOND] FAILED to set bond parameters: ${error?.message}`);
        this.logger.error(`[BOND] Error: ${JSON.stringify(error)}`);
        throw new Error(`Failed to set bond parameters: ${error?.message}`);
      }

      // 3. Save to MongoDB
      this.logger.log(`[BOND] Step 3: Saving bond to MongoDB...`);
      try {
        const bond = new this.bondModel({
          name: createBondDto.name,
          symbol: createBondDto.symbol,
          tokenId: result.tokenId,
          contractId: result.contractId,
          totalSupply: createBondDto.totalSupply,
          maturityDate: new Date(createBondDto.maturityDate * 1000),
          couponRate: createBondDto.couponRate,
          faceValue: createBondDto.faceValue,
          issuer: createBondDto.issuer,
          status: 'ACTIVE',
          createdAt: new Date()
        });

        await bond.save();
        this.logger.log(`[BOND] Bond saved to MongoDB successfully`);

        this.logger.log(`Bond created: ${createBondDto.symbol}`);

        return {
          success: true,
          bond,
          blockchain: result
        };
      } catch (error: any) {
        this.logger.error(`[BOND] FAILED to save bond to MongoDB: ${error?.message}`);
        this.logger.error(`[BOND] Error: ${JSON.stringify(error)}`);
        throw new Error(`Failed to save bond to MongoDB: ${error?.message}`);
      }
    } catch (error: any) {
      this.logger.error(`[BOND] CRITICAL ERROR in createBond: ${error?.message}`);
      this.logger.error(`[BOND] Stack: ${error?.stack}`);
      throw error;
    }
  }

  async payCoupon(bondId: string, amount: string) {
    try {
      this.logger.log(`[BOND] Starting payCoupon for bondId=${bondId}, amount=${amount}`);
      
      const bond = await this.bondModel.findById(bondId);
      
      if (!bond) {
        throw new Error('Bond not found');
      }

      const params = new ContractFunctionParameters()
        .addAddress(bond.tokenId)
        .addUint256(amount)
        .addUint256(Math.floor(Date.now() / 1000));

      const result = await this.resolverService.executeContractFunction(
        'payCoupon',
        params,
        2000000
      );

      // Update MongoDB
      bond.lastCouponPayment = new Date();
      await bond.save();

      this.logger.log(`[BOND] Coupon paid successfully for bondId=${bondId}`);
      return result;
    } catch (error: any) {
      this.logger.error(`[BOND] ERROR in payCoupon: ${error?.message}`);
      throw error;
    }
  }

  async getBondDetails(bondId: string) {
    try {
      this.logger.log(`[BOND] Getting bond details for bondId=${bondId}`);
      return this.bondModel.findById(bondId);
    } catch (error: any) {
      this.logger.error(`[BOND] ERROR in getBondDetails: ${error?.message}`);
      throw error;
    }
  }

  async listBonds(filters?: any) {
    try {
      this.logger.log(`[BOND] Listing bonds with filters: ${JSON.stringify(filters)}`);
      return this.bondModel.find(filters || {});
    } catch (error: any) {
      this.logger.error(`[BOND] ERROR in listBonds: ${error?.message}`);
      throw error;
    }
  }

  async findByCompany(companyId: string) {
    try {
      this.logger.log(`[BOND] Finding bonds for companyId=${companyId}`);
      return this.bondModel.find({ companyId }).exec();
    } catch (error: any) {
      this.logger.error(`[BOND] ERROR in findByCompany: ${error?.message}`);
      throw error;
    }
  }
}
