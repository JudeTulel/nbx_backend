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
} from '@nestjs/common';
import type { Response } from 'express';
import { UserService } from './users.service';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { ConfigService } from '@nestjs/config';

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

  @Post()
  async createUser(
    @Body() createUserDto: { username: string; password: string },
  ) {
    try {
      const { username, password } = createUserDto;

      if (!username || !password) {
        throw new HttpException(
          'Username and password are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (password.length < 8) {
        throw new HttpException(
          'Password must be at least 8 characters long',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.createUser(
        username,
        password,
        this.hederaClient,
      );

      return {
        username: user.username,
        hederaAccountId: user.hederaAccountId,
        hederaEVMAccount: user.hederaEVMAccount,
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(
        error.message || 'Error creating user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const user = await this.userService.login(body.username, body.password);
      return { message: 'Logged in', user: { username: user.username } };
    } catch (error) {
      res.status(401);
      return { message: (error as Error).message };
    }
  }

  @Get(':username')
  async getUser(@Param('username') username: string) {
    try {
      const user = await this.userService.findOne(username);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      return {
        username: user.username,
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

  @Put(':username')
  async updateUser(
    @Param('username') username: string,
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
        username,
        updateUserDto.password,
        this.hederaClient,
      );

      return {
        username: user.username,
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

  @Post(':username/sign-transaction')
  async signTransaction(
    @Param('username') username: string,
    @Body() body: { transaction: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const receipt = await this.userService.signTransaction(
        username,
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
