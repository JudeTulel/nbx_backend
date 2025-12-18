import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HederaService } from '../hedera.service';
import { 
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar,
  Client,
  AccountId,
  PrivateKey
} from '@hashgraph/sdk';

@Injectable()
export class FactoryContractService {
  private readonly logger = new Logger(FactoryContractService.name);
  private readonly factoryContractId: string;

  constructor(
    private readonly hederaService: HederaService,
    private readonly configService: ConfigService
  ) {
    const contractId = this.configService.get<string>('TESTNET_FACTORY_PROXY');
    if (!contractId) {
      throw new Error('FACTORY_CONTRACT_ID is not configured. Please set it in your environment variables.');
    }
    this.factoryContractId = contractId as string;
  }

  async createSecurityToken(params: {
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    tokenType: 'EQUITY' | 'BOND';
    regulationType: string;
    requireKYC: boolean;
    companyAccountId?: string; // Optional company account ID for signing
  }) {
    try {
      this.logger.log(`[FACTORY] Starting createSecurityToken for ${params.symbol}`);
      this.logger.log(`[FACTORY] Factory Contract ID: ${this.factoryContractId}`);
      this.logger.log(`[FACTORY] Company Account ID: ${params.companyAccountId || 'Using operator account'}`);
      this.logger.log(`[FACTORY] Parameters: ${JSON.stringify(params)}`);
      
      const client = this.hederaService.getClient();
      this.logger.log(`[FACTORY] Hedera client obtained`);

      const functionParams = new ContractFunctionParameters()
        .addString(params.name)
        .addString(params.symbol)
        .addUint8(params.decimals)
        .addUint256(params.totalSupply)
        .addString(params.tokenType)
        .addString(params.regulationType)
        .addBool(params.requireKYC);

      this.logger.log(`[FACTORY] Function parameters created successfully`);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.factoryContractId)
        .setGas(3000000)
        .setFunction('createSecurityToken', functionParams)
        .setPayableAmount(new Hbar(20));

      // If company account ID is provided, set it as the transaction payer
      if (params.companyAccountId) {
        this.logger.log(`[FACTORY] Setting company account ${params.companyAccountId} as transaction payer`);
        try {
          const companyAccountId = AccountId.fromString(params.companyAccountId);
          transaction.setTransactionMemo(`Bond/Equity creation by company ${params.companyAccountId}`);
          this.logger.log(`[FACTORY] Company account ID set successfully`);
        } catch (error: any) {
          this.logger.warn(`[FACTORY] Failed to parse company account ID: ${error?.message}. Using operator account.`);
        }
      }

      this.logger.log(`[FACTORY] Transaction created, executing...`);
      const response = await transaction.execute(client);
      this.logger.log(`[FACTORY] Transaction executed. ID: ${response.transactionId.toString()}`);
      
      this.logger.log(`[FACTORY] Waiting for receipt...`);
      const receipt = await response.getReceipt(client);
      
      this.logger.log(`[FACTORY] Receipt received. Status: ${receipt.status.toString()}`);
      this.logger.log(`[FACTORY] Token ID: ${receipt.tokenId?.toString()}`);
      this.logger.log(`[FACTORY] Contract ID: ${receipt.contractId?.toString()}`);

      this.logger.log(`Security token created: ${params.symbol}`);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        tokenId: receipt.tokenId?.toString(),
        contractId: receipt.contractId?.toString(),
        status: receipt.status.toString()
      };
    } catch (error: any) {
      this.logger.error(`[FACTORY] ERROR in createSecurityToken: ${error?.message}`);
      this.logger.error(`[FACTORY] Error type: ${error?.constructor?.name}`);
      this.logger.error(`[FACTORY] Full error: ${JSON.stringify(error)}`);
      this.logger.error(`[FACTORY] Error stack: ${error?.stack}`);
      if (error?.transactionId) {
        this.logger.error(`[FACTORY] Transaction ID: ${error.transactionId.toString()}`);
      }
      if (error?.status) {
        this.logger.error(`[FACTORY] Status: ${error.status}`);
      }
      if (error?.receipt) {
        this.logger.error(`[FACTORY] Receipt: ${JSON.stringify(error.receipt)}`);
      }
      throw error;
    }
  }
}
