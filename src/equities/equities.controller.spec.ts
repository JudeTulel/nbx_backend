import { Test, TestingModule } from '@nestjs/testing';
import { EquitiesController } from './equities.controller';

describe('EquitiesController', () => {
  let controller: EquitiesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquitiesController],
    }).compile();

    controller = module.get<EquitiesController>(EquitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
