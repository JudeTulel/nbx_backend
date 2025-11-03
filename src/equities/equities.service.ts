import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Equity } from './equity.schema';
import {
  CreateEquityDto,
  SetDividendDto,
  SetVotingRightsDto,
} from './dto/create-equity.dto';

@Injectable()
export class EquitiesService {
  private readonly logger = new Logger(EquitiesService.name);
  private network: any; // Network SDK instance

  constructor(
    @InjectModel(Equity.name)
    private readonly equityModel: Model<Equity>,
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
          factoryAddress: process.env.FACTORY_ADDRESS,
          resolverAddress: process.env.RESOLVER_ADDRESS 
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
   * Create a new equity using the SDK
   */
  async create(createEquityDto: CreateEquityDto): Promise<Equity> {
    try {
      if (!this.network) {
        await this.initializeSDK();
      }

      // Import Equity port
      const { Equity: EquityPort, CreateEquityRequest } = await import(
        '@hashgraph/asset-tokenization-sdk'
      );

      const equityRequest = new CreateEquityRequest({
        name: `Equity for ${createEquityDto.companyId}`,
        symbol: `EQ${createEquityDto.companyId}`,
        isin: `US${createEquityDto.companyId}EQ`,
        decimals: 2,
        isWhiteList: false,
        isControllable: true,
        arePartitionsProtected: false,
        isMultiPartition: false,
        clearingActive: false,
        internalKycActivated: false,
        diamondOwnerAccount: createEquityDto.diamondOwnerAccount,
        votingRight: createEquityDto.votingRight,
        informationRight: createEquityDto.informationRight,
        liquidationRight: createEquityDto.liquidationRight,
        subscriptionRight: createEquityDto.subscriptionRight,
        conversionRight: createEquityDto.conversionRight,
        redemptionRight: createEquityDto.redemptionRight,
        putRight: createEquityDto.putRight,
        dividendRight: createEquityDto.dividendRight ? 1 : 0,
        currency: createEquityDto.currency,
        numberOfShares: createEquityDto.numberOfShares.toString(),
        nominalValue: createEquityDto.nominalValue.toString(),
        regulationType: createEquityDto.regulationType,
        regulationSubType: createEquityDto.regulationSubType,
        isCountryControlListWhiteList:
          createEquityDto.isCountryControlListWhiteList,
        countries: createEquityDto.countries.join(','),
        info: `Equity created for company ${createEquityDto.companyId}`,
        configId: 'default',
        configVersion: 1,
        compliance: createEquityDto.enableERC3643 ? 'ERC3643' : undefined,
        identityRegistry: createEquityDto.identityRegistry,
      });

      const result = await EquityPort.create(equityRequest);

      // Save to database
      const equity = new this.equityModel({
        ...createEquityDto,
        countries: createEquityDto.countries,
        ...result.security,
        transactionId: result.transactionId,
      });

      return await equity.save();
    } catch (error) {
      this.logger.error(`Failed to create equity: ${error.message}`);
      throw new InternalServerErrorException('Failed to create equity');
    }
  }

  /**
   * Set dividends for an equity
   */
  async setDividends(setDividendDto: SetDividendDto): Promise<any> {
    try {
      if (!this.network) {
        await this.initializeSDK();
      }

      const { Equity: EquityPort, SetDividendsRequest } = await import(
        '@hashgraph/asset-tokenization-sdk'
      );

      const dividendRequest = new SetDividendsRequest({
        securityId: setDividendDto.securityId,
        amountPerUnitOfSecurity:
          setDividendDto.amountPerUnitOfSecurity.toString(),
        recordTimestamp: setDividendDto.recordTimestamp.toString(),
        executionTimestamp: setDividendDto.executionTimestamp.toString(),
      });

      const result = await EquityPort.setDividends(dividendRequest);

      // Update the equity document
      await this.equityModel.findOneAndUpdate(
        { diamondAddress: setDividendDto.securityId },
        {
          $push: {
            dividends: {
              id: result.payload.toString(),
              amountPerUnitOfSecurity: setDividendDto.amountPerUnitOfSecurity,
              recordTimestamp: setDividendDto.recordTimestamp,
              executionTimestamp: setDividendDto.executionTimestamp,
              transactionId: result.transactionId,
            },
          },
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to set dividends: ${error.message}`);
      throw new InternalServerErrorException('Failed to set dividends');
    }
  }

  /**
   * Set voting rights for an equity
   */
  async setVotingRights(setVotingRightsDto: SetVotingRightsDto): Promise<any> {
    try {
      if (!this.network) {
        await this.initializeSDK();
      }

      const { Equity: EquityPort, SetVotingRightsRequest } = await import(
        '@hashgraph/asset-tokenization-sdk'
      );

      const votingRequest = new SetVotingRightsRequest({
        securityId: setVotingRightsDto.securityId,
        recordTimestamp: setVotingRightsDto.recordTimestamp.toString(),
        data: setVotingRightsDto.data,
      });

      const result = await EquityPort.setVotingRights(votingRequest);

      // Update the equity document
      await this.equityModel.findOneAndUpdate(
        { diamondAddress: setVotingRightsDto.securityId },
        {
          $push: {
            votingRights: {
              id: result.payload.toString(),
              recordTimestamp: setVotingRightsDto.recordTimestamp,
              data: setVotingRightsDto.data,
              transactionId: result.transactionId,
            },
          },
        },
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to set voting rights: ${error.message}`);
      throw new InternalServerErrorException('Failed to set voting rights');
    }
  }

  /**
   * Find all equities
   */
  async findAll(): Promise<Equity[]> {
    return await this.equityModel.find().exec();
  }

  /**
   * Find equity by ID
   */
  async findOne(id: string): Promise<Equity> {
    const equity = await this.equityModel.findById(id).exec();
    if (!equity) {
      throw new BadRequestException('Equity not found');
    }
    return equity;
  }

  /**
   * Find equities by company ID
   */
  async findByCompany(companyId: string): Promise<Equity[]> {
    return await this.equityModel.find({ companyId }).exec();
  }
}
