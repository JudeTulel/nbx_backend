import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { EquitiesModule } from './equities/equities.module';
import { CompaniesModule } from './companies/companies.module';
import { BondsModule } from './bonds/bonds.module';
import { UploadsModule } from './uploads/uploads.module';
import { AuthModule } from './auth/auth.module';
import { HashgraphModule } from './hashgraph/hashgraph.module';

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
    UploadsModule,
    AuthModule,
    HashgraphModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
