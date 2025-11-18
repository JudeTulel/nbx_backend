import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Bond } from './bond.schema';
import { CreateBondDto, SetCouponDto } from './dto/create-bond.dto';
import { HashgraphService } from '../hashgraph/hashgraph.service';

@Injectable()
export class BondsService {
  private readonly logger = new Logger(BondsService.name);
  // Network handled by HashgraphService

  constructor(
    @InjectModel(Bond.name)
    private readonly bondModel: Model<Bond>,
    private readonly hashgraph: HashgraphService,
  ) {}


  /**
   * Create a new bond using the SDK
   */
  async create(createBondDto: CreateBondDto): Promise<Bond> {
    try {
      const BondPort = await this.hashgraph.getBondPort();
      const { CreateBondRequest } = await import('@hashgraph/asset-tokenization-sdk');

      const bondRequest = new CreateBondRequest({
        name: `Bond for ${createBondDto.companyId}`,
        symbol: `BD${createBondDto.companyId}`,
        isin: `US${createBondDto.companyId}BD`,
        decimals: 2,
        isWhiteList: false,
        isControllable: true,
        arePartitionsProtected: false,
        isMultiPartition: false,
        clearingActive: false,
        internalKycActivated: false,
        diamondOwnerAccount: createBondDto.diamondOwnerAccount,
        currency: createBondDto.currency,
        numberOfUnits: createBondDto.numberOfUnits.toString(),
        nominalValue: createBondDto.nominalValue.toString(),
        startingDate: createBondDto.startingDate.toString(),
        maturityDate: createBondDto.maturityDate.toString(),
        couponFrequency: 'annual', // Default
        couponRate: '5.0', // Default
        firstCouponDate: createBondDto.startingDate.toString(),
        regulationType: createBondDto.regulationType,
        regulationSubType: createBondDto.regulationSubType,
        isCountryControlListWhiteList:
          createBondDto.isCountryControlListWhiteList,
        countries: createBondDto.countries.join(','),
        info: `Bond created for company ${createBondDto.companyId}`,
        configId: 'default',
        configVersion: 1,
        compliance: createBondDto.enableERC3643 ? 'ERC3643' : undefined,
        identityRegistry: createBondDto.identityRegistry,
      });

      const result = await BondPort.create(bondRequest);

      // Save to database
      const bond = new this.bondModel({
        ...createBondDto,
        countries: createBondDto.countries,
        ...result.security,
        transactionId: result.transactionId,
      });

      return await bond.save();
    } catch (error) {
      this.logger.error(`Failed to create bond: ${error.message}`);
      throw new InternalServerErrorException('Failed to create bond');
    }
  }

  /**
   * Set coupon for a bond
   */
  async setCoupon(setCouponDto: SetCouponDto): Promise<any> {
    try {
      const BondPort = await this.hashgraph.getBondPort();
      const { SetCouponRequest } = await import('@hashgraph/asset-tokenization-sdk');

      const couponRequest = new SetCouponRequest({
        securityId: setCouponDto.securityId,
        rate: setCouponDto.rate.toString(),
        recordTimestamp: setCouponDto.recordTimestamp.toString(),
        executionTimestamp: setCouponDto.executionTimestamp.toString(),
      });

      const result = await BondPort.setCoupon(couponRequest);

      // Update the bond document
      await this.bondModel.findOneAndUpdate(
        { diamondAddress: setCouponDto.securityId },
        {
          $push: {
            coupons: {
              id: result.payload.toString(),
              rate: setCouponDto.rate,
              recordTimestamp: setCouponDto.recordTimestamp,
              executionTimestamp: setCouponDto.executionTimestamp,
              transactionId: result.transactionId,
            },
          },
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to set coupon: ${error.message}`);
      throw new InternalServerErrorException('Failed to set coupon');
    }
  }

  /**
   * Find all bonds
   */
  async findAll(): Promise<Bond[]> {
    return await this.bondModel.find().exec();
  }

  /**
   * Find bond by ID
   */
  async findOne(id: string): Promise<Bond> {
    const bond = await this.bondModel.findById(id).exec();
    if (!bond) {
      throw new BadRequestException('Bond not found');
    }
    return bond;
  }

  /**
   * Find bonds by company ID
   */
  async findByCompany(companyId: string): Promise<Bond[]> {
    return await this.bondModel.find({ companyId }).exec();
  }
}
