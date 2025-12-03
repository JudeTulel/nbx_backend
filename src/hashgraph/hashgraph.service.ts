import { Injectable, Logger, OnModuleInit, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HashgraphService implements OnModuleInit {
  private readonly logger = new Logger(HashgraphService.name);
  private network: any;
  private isInitialized = false;
  private sdkModule: any = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.initializeSDK();
    } catch (err) {
      // Don't throw here to avoid crashing the whole app during startup in dev
      this.logger.error(`HashgraphService failed to initialize on startup: ${err?.message ?? err}`);
    }
  }

  async initializeSDK() {
    if (this.isInitialized) return;

    try {
      const sdk = await this.getSdkModule();
      const { Network } = sdk;
      this.network = Network;

      const factoryAddress = this.configService.get<string>('FACTORY_ADDRESS');
      const resolverAddress = this.configService.get<string>('RESOLVER_ADDRESS');
      const networkName = this.configService.get<string>('HEDERA_NETWORK') || 'testnet';
      const mirrorBase = this.configService.get<string>('HEDERA_MIRROR_NODE') || 'https://testnet.mirrornode.hedera.com';
      const rpcBase = this.configService.get<string>('HEDERA_RPC_NODE') || 'https://testnet.hashio.io/api';

      if (!factoryAddress || !resolverAddress) {
        throw new Error('FACTORY_ADDRESS and RESOLVER_ADDRESS must be set in environment variables.');
      }

      // Initialize the SDK using a plain object (matches SDK README)
      await this.network.init({
        network: networkName,
        mirrorNode: {
          name: `Hedera ${networkName}`,
          baseUrl: mirrorBase,
        },
        rpcNode: {
          name: `Hedera ${networkName}`,
          baseUrl: rpcBase,
        },
        events: {
          walletInit: () => this.logger.log('Wallet initialized'),
          walletFound: () => this.logger.log('Wallet found'),
        },
        configuration: {
          factoryAddress,
          resolverAddress,
        },
        factories: {
          factories: [],
        },
        resolvers: {
          resolvers: [],
        },
      });

      this.isInitialized = true;
      this.logger.log('Asset Tokenization SDK initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize Asset Tokenization SDK: ${error?.message ?? error}`);
      throw new InternalServerErrorException('Failed to initialize Asset Tokenization SDK');
    }
  }

  async ensureInitialized() {
    if (!this.isInitialized) {
      await this.initializeSDK();
    }
  }

  getNetwork() {
    return this.network;
  }

  async getEquityPort(): Promise<any> {
    await this.ensureInitialized();
    const sdk = await this.getSdkModule();
    return sdk.Equity;
  }

  async getBondPort(): Promise<any> {
    await this.ensureInitialized();
    const sdk = await this.getSdkModule();
    return sdk.Bond;
  }

  private async getSdkModule() {
    if (this.sdkModule) {
      return this.sdkModule;
    }

    try {
      // Try loading the package root (respects package.json exports)
      this.logger.log('Loading Asset Tokenization SDK...');
      const mod = await import('@hashgraph/asset-tokenization-sdk');
      this.sdkModule = (mod && (mod.default || mod)) as any;
      this.logger.log('Asset Tokenization SDK loaded successfully');
      // Log available exports for debugging
      try {
        this.logger.debug(`Available SDK exports: ${Object.keys(this.sdkModule).join(', ')}`);
      } catch {}
      return this.sdkModule;
    } catch (error) {
      this.logger.error(`Failed to load Asset Tokenization SDK: ${error?.message ?? error}`);
      throw new Error('Unable to load Asset Tokenization SDK');
    }
  }
}
