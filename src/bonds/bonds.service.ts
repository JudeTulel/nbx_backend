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

@Injectable()
export class BondsService {
  private readonly logger = new Logger(BondsService.name);
  private network: any; // Network SDK instance

  constructor(
    @InjectModel(Bond.name)
    private readonly bondModel: Model<Bond>,
  ) {}

  /**
   * Initialize the SDK (this should be called during app startup)
   */
  async initializeSDK() {
    try {
      // Import the SDK dynamically
      const { Network } = await import('@hashgraph/asset-tokenization-sdk');

      this.network = Network;

      // Initialize with testnet configuration
      const supportedWallets = await this.network.init({
        network: 'testnet',
        mirrorNode: {
          name: 'Hedera Testnet',
          baseUrl: 'https://testnet.mirrornode.hedera.com',
        },
        rpcNode: {
          name: 'Hedera Testnet',
          baseUrl: 'https://testnet.hashio.io/api',
        },
        events: {
          walletInit: () => this.logger.log('Wallet initialized'),
          walletFound: () => this.logger.log('Wallet found'),
        },
        configuration: {
          factoryAddress: process.env.FACTORY_ADDRESS || '0.0.1234567',
          resolverAddress: process.env.RESOLVER_ADDRESS || '0.0.1234568',
        },
        factories: {
          factories: [],
        },
        resolvers: {
          resolvers: [],
        },
      });

      this.logger.log('Asset Tokenization SDK initialized successfully');
      return supportedWallets;
    } catch (error) {
      this.logger.error(`Failed to initialize SDK: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to initialize Asset Tokenization SDK',
      );
    }
  }

  /**
   * Create a new bond using the SDK
   */
  async create(createBondDto: CreateBondDto): Promise<Bond> {
    try {
      if (!this.network) {
        await this.initializeSDK();
      }

      // Import Bond port
      const { Bond: BondPort, CreateBondRequest } = await import(
        '@hashgraph/asset-tokenization-sdk'
      );

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
      if (!this.network) {
        await this.initializeSDK();
      }

      const { Bond: BondPort, SetCouponRequest } = await import(
        '@hashgraph/asset-tokenization-sdk'
      );

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
