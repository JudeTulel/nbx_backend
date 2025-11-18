import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  HttpException,
  HttpStatus,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { UserService } from './users.service';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
export class UserController {
  private hederaClient: Client;

  constructor(
    private userService: UserService,
    private configService: ConfigService,
  ) {
    const operatorId = this.configService.get<string>('HEDERA_OPERATOR_ID');
    const operatorKeyRaw = this.configService.get<string>(
      'HEDERA_OPERATOR_KEY',
    );

    if (!operatorId || !operatorKeyRaw) {
      this.hederaClient = Client.forTestnet();
    } else {
      let operatorKey: PrivateKey;
      try {
        operatorKey = PrivateKey.fromStringECDSA(operatorKeyRaw);
      } catch (err) {
        throw new Error(
          `Invalid HEDERA_OPERATOR_KEY: ${(err as Error).message}`,
        );
      }

      this.hederaClient = Client.forTestnet().setOperator(
        operatorId,
        operatorKey,
        );
    }
  }

  // The original POST /users (create user) and POST /users/login are now handled by the AuthModule.

  @UseGuards(JwtAuthGuard)
  @Get(':useremail')
  async getUser(@Param('useremail') useremail: string) {
    try {
      const user = await this.userService.findOne(useremail);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return {
        useremail: user.useremail,
        hederaAccountId: user.hederaAccountId,
        hederaEVMAccount: user.hederaEVMAccount,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error retrieving user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put(':useremail')
  async updateUser(
    @Param('useremail') useremail: string,
    @Body() updateUserDto: { password?: string },
  ) {
    try {
      if (!updateUserDto.password) {
        throw new HttpException(
          'New password is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (updateUserDto.password.length < 8) {
        throw new HttpException(
          'Password must be at least 8 characters long',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.updateUser(
        useremail,
        updateUserDto.password,
        this.hederaClient,
      );

      return {
        useremail: user.useremail,
        hederaAccountId: user.hederaAccountId,
        hederaEVMAccount: user.hederaEVMAccount,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error updating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':useremail/sign-transaction')
  async signTransaction(
    @Param('useremail') useremail: string,
    @Body() body: { transaction: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const receipt = await this.userService.signTransaction(
        useremail,
        body.transaction,
        body.password,
      );
      return {
        message: 'Transaction signed successfully',
        receipt,
      };
    } catch (error) {
      res.status(400);
      return { message: (error as Error).message };
    }
  }
}
