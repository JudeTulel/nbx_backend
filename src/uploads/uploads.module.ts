import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';
import { Company, CompanySchema } from '../companies/company.schema';
import { KYC, KYCSchema } from '../kyc/kyc.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: KYC.name, schema: KYCSchema },
    ]),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService], // Export to use in other modules
})
export class UploadsModule {}
