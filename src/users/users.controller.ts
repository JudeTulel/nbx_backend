// user.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { UserService } from './users.service';
import { Client } from '@hashgraph/sdk';

@Controller('users')
export class UserController {
  private hederaClient: Client;

  constructor(private userService: UserService) {
    this.hederaClient = Client.forTestnet()
      .setOperator(process.env.HEDERA_ACCOUNT_ID!, process.env.HEDERA_PRIVATE_KEY!);
  }
  @Post()
  async createUser(@Body() createUserDto: { username: string; password: string }) {
    try {
      const { username, password } = createUserDto;
      
      // Validate input
      if (!username || !password) {
        throw new HttpException('Username and password are required', HttpStatus.BAD_REQUEST);
      }
      
      if (password.length < 8) {
        throw new HttpException('Password must be at least 8 characters long', HttpStatus.BAD_REQUEST);
      }
      
      const user = await this.userService.createUser(username, password, this.hederaClient);
      
      // Return user without sensitive information
      return {
        id: user._id,
        username: user.username,
        hederaAccountId: user.hederaAccountId,
        hederaEVMAccount: user.hederaEVMAccount
      };
    } catch (error) {
      if (error.code === 11000) {
        // MongoDB duplicate key error
        throw new HttpException('Username already exists', HttpStatus.CONFLICT);
      }
      throw new HttpException(error.message || 'Error creating user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}