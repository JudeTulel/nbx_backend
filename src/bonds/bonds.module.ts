import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BondsController } from './bonds.controller';
import { BondsService } from './bonds.service';
import { Bond, BondSchema } from './bond.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Bond.name, schema: BondSchema }]),
  ],
  controllers: [BondsController],
  providers: [BondsService],
  exports: [BondsService],
})
export class BondsModule {}
