import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HederaService } from '../hedera.service';
import { 
  ContractExecuteTransaction,
  ContractCallQuery,
  ContractFunctionParameters
} from '@hashgraph/sdk';

@Injectable()
export class ResolverContractService {
  private readonly logger = new Logger(ResolverContractService.name);
  private readonly resolverContractId: string;

  constructor(
    private readonly hederaService: HederaService,
    private readonly configService: ConfigService
  ) {
    const contractId = this.configService.get<string>('TESTNET_BUSINESSLOGICRESOLVER_PROXY');
    if (!contractId) {
      throw new Error('RESOLVER_CONTRACT_ID is not configured. Please set it in your environment variables.');
    }
    this.resolverContractId = contractId as string;
  }

  async executeContractFunction(
    functionName: string,
    params: ContractFunctionParameters,
    gas: number = 1000000
  ) {
    try {
      this.logger.log(`[RESOLVER] Starting executeContractFunction: ${functionName}`);
      this.logger.log(`[RESOLVER] Resolver Contract ID: ${this.resolverContractId}`);
      this.logger.log(`[RESOLVER] Gas: ${gas}`);
      
      const client = this.hederaService.getClient();
      this.logger.log(`[RESOLVER] Hedera client obtained`);

      const transaction = new ContractExecuteTransaction()
        .setContractId(this.resolverContractId)
        .setGas(gas)
        .setFunction(functionName, params);

      this.logger.log(`[RESOLVER] Transaction created, executing...`);
      const response = await transaction.execute(client);
      this.logger.log(`[RESOLVER] Transaction executed. ID: ${response.transactionId.toString()}`);
      
      this.logger.log(`[RESOLVER] Waiting for receipt...`);
      const receipt = await response.getReceipt(client);
      
      this.logger.log(`[RESOLVER] Receipt received. Status: ${receipt.status.toString()}`);

      return {
        transactionId: response.transactionId.toString(),
        status: receipt.status.toString(),
        receipt
      };
    } catch (error: any) {
      this.logger.error(`[RESOLVER] ERROR in executeContractFunction (${functionName}): ${error?.message}`);
      this.logger.error(`[RESOLVER] Error type: ${error?.constructor?.name}`);
      this.logger.error(`[RESOLVER] Full error: ${JSON.stringify(error)}`);
      this.logger.error(`[RESOLVER] Error stack: ${error?.stack}`);
      if (error?.transactionId) {
        this.logger.error(`[RESOLVER] Transaction ID: ${error.transactionId.toString()}`);
      }
      if (error?.status) {
        this.logger.error(`[RESOLVER] Status: ${error.status}`);
      }
      if (error?.receipt) {
        this.logger.error(`[RESOLVER] Receipt: ${JSON.stringify(error.receipt)}`);
      }
      throw error;
    }
  }

  async queryContractFunction(
    functionName: string,
    params: ContractFunctionParameters,
    gas: number = 100000
  ) {
    try {
      this.logger.log(`[RESOLVER] Starting queryContractFunction: ${functionName}`);
      this.logger.log(`[RESOLVER] Resolver Contract ID: ${this.resolverContractId}`);
      
      const client = this.hederaService.getClient();

      const query = new ContractCallQuery()
        .setContractId(this.resolverContractId)
        .setGas(gas)
        .setFunction(functionName, params);

      this.logger.log(`[RESOLVER] Query executing...`);
      const result = await query.execute(client);
      this.logger.log(`[RESOLVER] Query executed successfully`);
      
      return result;
    } catch (error: any) {
      this.logger.error(`[RESOLVER] ERROR in queryContractFunction (${functionName}): ${error?.message}`);
      this.logger.error(`[RESOLVER] Error type: ${error?.constructor?.name}`);
      this.logger.error(`[RESOLVER] Full error: ${JSON.stringify(error)}`);
      this.logger.error(`[RESOLVER] Error stack: ${error?.stack}`);
      throw error;
    }
  }
}
