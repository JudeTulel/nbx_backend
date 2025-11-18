import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HashgraphService } from './hashgraph.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [HashgraphService],
  exports: [HashgraphService],
})
export class HashgraphModule {}
