import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { Company, CompanySchema } from './company.schema';
import { EquityModule } from '../equity/equity.module';
import { BondModule } from '../bond/bond.module';
import { User, UserSchema } from '../users/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
    ]),
    EquityModule,
    BondModule,
  ],
  providers: [CompaniesService],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
