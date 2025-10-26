import { Test, TestingModule } from '@nestjs/testing';
import { EquitiesService } from './equities.service';

describe('EquitiesService', () => {
  let service: EquitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EquitiesService],
    }).compile();

    service = module.get<EquitiesService>(EquitiesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
