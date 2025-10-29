import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquitiesController } from './equities.controller';
import { EquitiesService } from './equities.service';
import { Equity, EquitySchema } from './equity.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Equity.name, schema: EquitySchema }]),
  ],
  controllers: [EquitiesController],
  providers: [EquitiesService],
  exports: [EquitiesService],
})
export class EquitiesModule {}
