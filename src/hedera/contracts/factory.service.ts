import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HederaService } from '../hedera.service';
import { 
  ContractExecuteTransaction,
  ContractFunctionParameters,
  Hbar
} from '@hashgraph/sdk';

@Injectable()
export class FactoryContractService {
  private readonly logger = new Logger(FactoryContractService.name);
  private readonly factoryContractId: string;

  constructor(
    private readonly hederaService: HederaService,
    private readonly configService: ConfigService
  ) {
    const contractId = this.configService.get<string>('FACTORY_CONTRACT_ID');
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
  }) {
    const client = this.hederaService.getClient();

    const functionParams = new ContractFunctionParameters()
      .addString(params.name)
      .addString(params.symbol)
      .addUint8(params.decimals)
      .addUint256(params.totalSupply)
      .addString(params.tokenType)
      .addString(params.regulationType)
      .addBool(params.requireKYC);

    const transaction = new ContractExecuteTransaction()
      .setContractId(this.factoryContractId)
      .setGas(3000000)
      .setFunction('createSecurityToken', functionParams)
      .setPayableAmount(new Hbar(20));

    const response = await transaction.execute(client);
    const receipt = await response.getReceipt(client);

    this.logger.log(`Security token created: ${params.symbol}`);

    return {
      success: true,
      transactionId: response.transactionId.toString(),
      tokenId: receipt.tokenId?.toString(),
      contractId: receipt.contractId?.toString(),
      status: receipt.status.toString()
    };
  }
}
