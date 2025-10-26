import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { EquitiesController } from './equities/equities.controller';
import { EquitiesService } from './equities/equities.service';
import { EquitiesModule } from './equities/equities.module';
import { CompaniesModule } from './companies/companies.module';
import { BondsModule } from './bonds/bonds.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    EquitiesModule,
    CompaniesModule,
    BondsModule,
  ],
  controllers: [AppController, EquitiesController],
  providers: [AppService, EquitiesService],
})
export class AppModule {}
