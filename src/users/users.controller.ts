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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

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
    @Body() updateUserDto: UpdatePasswordDto,
  ) {
    try {
      if (!updateUserDto.currentPassword) {
        throw new HttpException(
          'Current password is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!updateUserDto.newPassword || updateUserDto.newPassword.length < 8) {
        throw new HttpException(
          'Password must be at least 8 characters long',
          HttpStatus.BAD_REQUEST,
        );
      }

      const user = await this.userService.updateUser(
        useremail,
        updateUserDto.currentPassword,
        updateUserDto.newPassword,
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
