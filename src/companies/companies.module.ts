import { Module } from "@nestjs/common"
import { MongooseModule } from "@nestjs/mongoose"
import { CompaniesService } from "./companies.service"
import { CompaniesController } from "./companies.controller"
import { Company, CompanySchema } from "./company.schema"

@Module({
  imports: [MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }])],
  providers: [CompaniesService],
  controllers: [CompaniesController],
})
export class CompaniesModule {}
