import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { OnrampController } from './onramp.controller';
import { OnrampService } from './onramp.service';
import { Payment, PaymentSchema } from './payment.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
    ]),
    UsersModule,
  ],
  controllers: [OnrampController],
  providers: [OnrampService],
  exports: [OnrampService],
})
export class OnrampModule {}