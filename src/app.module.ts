import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { CompaniesModule } from './companies/companies.module';
// import { BondModule } from './bond/bond.module';
import { UploadsModule } from './uploads/uploads.module';
import { AuthModule } from './auth/auth.module';
// import { HederaModule } from './hedera/hedera.module';
// import { TokenizationModule } from './tokenization/tokenization.module';
// import { EquityModule } from './equity/equity.module';
// import { ComplianceModule } from './compliance/compliance.module';
// import { CorporateActionsModule } from './corporate-actions/corporate-actions.module';
import { KYCModule } from './kyc/kyc.module';
import { OnrampModule } from './onramp/onramp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting: 100 requests per minute globally
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CompaniesModule,
    // BondModule,
    UploadsModule,
    AuthModule,
    KYCModule,
    OnrampModule,
    // HederaModule,
    // TokenizationModule,
    // EquityModule,
    // ComplianceModule,
    // CorporateActionsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
