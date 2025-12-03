import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  Client, 
  AccountId, 
  PrivateKey,
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractFunctionParameters
} from '@hashgraph/sdk';

@Injectable()
export class HederaService implements OnModuleInit {
  private readonly logger = new Logger(HederaService.name);
  private client: Client;
  private operatorAccountId: AccountId;
  private operatorPrivateKey: PrivateKey;
  private isInitialized = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      await this.initialize();
    } catch (err) {
      this.logger.error(`Failed to initialize Hedera: ${err?.message}`);
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    const network = this.configService.get<string>('HEDERA_NETWORK', 'testnet');
    const operatorId = this.configService.get<string>('HEDERA_OPERATOR_ID');
    const operatorKey = this.configService.get<string>('HEDERA_OPERATOR_KEY');

    if (!operatorId || !operatorKey) {
      throw new Error('HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY required');
    }

    this.operatorAccountId = AccountId.fromString(operatorId);
    this.operatorPrivateKey = PrivateKey.fromString(operatorKey);

    this.client = network === 'mainnet' 
      ? Client.forMainnet() 
      : Client.forTestnet();

    this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);
    
    this.isInitialized = true;
    this.logger.log(`Hedera client initialized on ${network}`);
  }

  getClient(): Client {
    if (!this.isInitialized) {
      throw new Error('Hedera client not initialized');
    }
    return this.client;
  }

  getOperatorAccountId(): AccountId {
    return this.operatorAccountId;
  }

  async onModuleDestroy() {
    if (this.client) {
      this.client.close();
    }
  }
}
