import { Test, TestingModule } from '@nestjs/testing';
import { TokenizationService } from './tokenization.service';

describe('TokenizationService', () => {
  let service: TokenizationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenizationService],
    }).compile();

    service = module.get<TokenizationService>(TokenizationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
