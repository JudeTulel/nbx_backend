import { Test, TestingModule } from '@nestjs/testing';
import { OnrampController } from './onramp.controller';

describe('OnrampController', () => {
  let controller: OnrampController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OnrampController],
    }).compile();

    controller = module.get<OnrampController>(OnrampController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
