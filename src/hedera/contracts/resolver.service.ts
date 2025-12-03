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
    const contractId = this.configService.get<string>('RESOLVER_CONTRACT_ID');
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
    const client = this.hederaService.getClient();

    const transaction = new ContractExecuteTransaction()
      .setContractId(this.resolverContractId)
      .setGas(gas)
      .setFunction(functionName, params);

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    return {
      transactionId: response.transactionId.toString(),
      status: receipt.status.toString(),
      receipt
    };
  }

  async queryContractFunction(
    functionName: string,
    params: ContractFunctionParameters,
    gas: number = 100000
  ) {
    const client = this.hederaService.getClient();

    const query = new ContractCallQuery()
      .setContractId(this.resolverContractId)
      .setGas(gas)
      .setFunction(functionName, params);

    return await query.execute(client);
  }
}
