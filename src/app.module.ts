import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { MarketsModule } from './markets/markets.module';
import { CompanyController } from './company/company.controller';
import { CompanyService } from './company/company.service';
import { CompanyModule } from './company/company.module';
import { FilesModule } from './files/files.module';
import { GovernanceController } from './governance/governance.controller';
import { GovernanceService } from './governance/governance.service';
import { GovernanceModule } from './governance/governance.module';

@Module({
  imports: [UsersModule, MarketsModule, CompanyModule, FilesModule, GovernanceModule],
  controllers: [AppController, CompanyController, GovernanceController],
  providers: [AppService, CompanyService, GovernanceService],
})
export class AppModule {}
