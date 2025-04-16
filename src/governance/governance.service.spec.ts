import { Test, TestingModule } from '@nestjs/testing';
import { GovernanceService } from './governance.service';

describe('GovernanceService', () => {
  let service: GovernanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GovernanceService],
    }).compile();

    service = module.get<GovernanceService>(GovernanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
