import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { Company, CompanySchema } from './company.schema';
import { Equity, EquitySchema } from './equity.schema';
import { Bond, BondSchema } from './bond.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Equity.name, schema: EquitySchema },
      { name: Bond.name, schema: BondSchema },
    ]),
    UploadsModule,
    UsersModule,
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule { }