import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BondController } from './bond.controller';
import { BondService } from './bond.service';
import { Bond, BondSchema } from './schemas/bond.schema';
import { HederaModule } from '../hedera/hedera.module';
import { FactoryContractService } from '../hedera/contracts/factory.service';
import { ResolverContractService } from '../hedera/contracts/resolver.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bond.name, schema: BondSchema }]),
    HederaModule // Import instead of old HashgraphModule
  ],
  controllers: [BondController],
  providers: [
    BondService,
    FactoryContractService,
    ResolverContractService
  ],
  exports: [BondService]
})
export class BondModule {}
