import { Module } from '@nestjs/common';
import { TokenizationService } from './tokenization.service';

@Module({
  providers: [TokenizationService]
})
export class TokenizationModule {}
