import { Test, TestingModule } from '@nestjs/testing';
import { BondsService } from './bonds.service';

describe('BondsService', () => {
  let service: BondsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BondsService],
    }).compile();

    service = module.get<BondsService>(BondsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
