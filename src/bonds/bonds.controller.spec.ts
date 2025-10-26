import { Test, TestingModule } from '@nestjs/testing';
import { BondsController } from './bonds.controller';

describe('BondsController', () => {
  let controller: BondsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BondsController],
    }).compile();

    controller = module.get<BondsController>(BondsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
