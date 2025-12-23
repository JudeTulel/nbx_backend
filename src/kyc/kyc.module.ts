// kyc.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KYCController } from './kyc.controller';
import { KYCService } from './kyc.service';
import { KYC, KYCSchema } from './kyc.schema';
import { User, UserSchema } from '../users/users.schema';
import { UploadsModule } from '../uploads/uploads.module'; // Add this import

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KYC.name, schema: KYCSchema },
      { name: User.name, schema: UserSchema },
    ]),
    UploadsModule, // Add this line
  ],
  controllers: [KYCController],
  providers: [KYCService],
  exports: [KYCService],
})
export class KYCModule {}