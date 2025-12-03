import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquityController } from './equity.controller';
import { EquityService } from './equity.service';
import { Equity, EquitySchema } from './schemas/equity.schema';
import { HederaModule } from '../hedera/hedera.module';
import { FactoryContractService } from '../hedera/contracts/factory.service';
import { ResolverContractService } from '../hedera/contracts/resolver.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Equity.name, schema: EquitySchema }]),
    HederaModule // Import instead of old HashgraphModule
  ],
  controllers: [EquityController],
  providers: [
    EquityService,
    FactoryContractService,
    ResolverContractService
  ],
  exports: [EquityService]
})
export class EquityModule {}
