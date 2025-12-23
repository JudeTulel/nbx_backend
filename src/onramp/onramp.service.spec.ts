import { Test, TestingModule } from '@nestjs/testing';
import { OnrampService } from './onramp.service';

describe('OnrampService', () => {
  let service: OnrampService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OnrampService],
    }).compile();

    service = module.get<OnrampService>(OnrampService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
