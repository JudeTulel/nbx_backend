import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HederaService } from './hedera.service';

@Global() // Make available to all modules
@Module({
  imports: [ConfigModule],
  providers: [HederaService],
  exports: [HederaService]
})
export class HederaModule {}
