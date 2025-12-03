import { Test, TestingModule } from '@nestjs/testing';
import { EquityService } from './equity.service';

describe('EquityService', () => {
  let service: EquityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquityService],
    }).compile();

    service = module.get<EquityService>(EquityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
