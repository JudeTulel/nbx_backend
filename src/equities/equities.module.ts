import { Module } from '@nestjs/common';
import { EquitiesService } from './equities.service';

@Module({
  providers: [EquitiesService]
})
export class EquitiesModule {}
