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
      // 1. Create bond token on Hedera
      const result = await this.factoryService.createSecurityToken({
        name: createBondDto.name,
        symbol: createBondDto.symbol,
        decimals: 2, // Bonds typically use 2 decimals
        totalSupply: createBondDto.totalSupply,
        tokenType: 'BOND',
        regulationType: createBondDto.regulationType || 'REG_S',
        requireKYC: true
      });

      // 2. Set bond-specific parameters
      const bondParams = new ContractFunctionParameters()
        .addAddress(result.tokenId!)
        .addUint256(createBondDto.maturityDate)
        .addUint256(createBondDto.couponRate)
        .addUint256(createBondDto.faceValue);

      await this.resolverService.executeContractFunction(
        'setBondParameters',
        bondParams,
        500000
      );

      // 3. Save to MongoDB
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

      this.logger.log(`Bond created: ${createBondDto.symbol}`);

      return {
        success: true,
        bond,
        blockchain: result
      };
    } catch (error) {
      this.logger.error(`Failed to create bond: ${error?.message}`);
      throw error;
    }
  }

  async payCoupon(bondId: string, amount: string) {
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

    return result;
  }

  async getBondDetails(bondId: string) {
    return this.bondModel.findById(bondId);
  }

  async listBonds(filters?: any) {
    return this.bondModel.find(filters || {});
  }

  async findByCompany(companyId: string) {
    return this.bondModel.find({ companyId }).exec();
  }
}
