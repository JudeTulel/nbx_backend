import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// DTO for user registration
export class CreateUserDto {
  useremail: string;
  password: string;
  hederaAccountId: string;
  role?: string;
}

// DTO for login
export class LoginDto {
  useremail: string;
  password: string;
}

// DTO for password update
export class UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

// DTO for role update
export class UpdateRoleDto {
  newRole: string;
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
   * Register a new user
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() createUserDto: CreateUserDto) {
    const { useremail, password, hederaAccountId, role = 'investor' } = createUserDto;

    const user = await this.userService.createUser(
      useremail,
      password,
      hederaAccountId,
      role,
    );

    // Return user without sensitive data
    return {
      message: 'User registered successfully',
      user: {
        id: user._id,
        useremail: user.useremail,
        role: user.role,
        hederaAccountId: user.hederaAccountId,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Login user
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const { useremail, password } = loginDto;

    const user = await this.userService.login(useremail, password);

    // Return user without sensitive data
    return {
      message: 'Login successful',
      user: {
        id: user._id,
        useremail: user.useremail,
        role: user.role,
        hederaAccountId: user.hederaAccountId,
        lastLogin: user.lastLogin,
      },
    };
  }

  /**
   * Get user profile
   */
  @Get('profile/:useremail')
  async getProfile(@Param('useremail') useremail: string) {
    const user = await this.userService.getUserProfile(useremail);
    return {
      user,
    };
  }

  /**
   * Get user by Hedera account ID
   */
  @Get('hedera/:accountId')
  async getByHederaAccount(@Param('accountId') accountId: string) {
    const user = await this.userService.findByHederaAccount(accountId);
    return {
      user: {
        id: user._id,
        useremail: user.useremail,
        role: user.role,
        hederaAccountId: user.hederaAccountId,
      },
    };
  }

  /**
   * Update user password
   */
  @Put('password/:useremail')
  @HttpCode(HttpStatus.OK)
  async updatePassword(
    @Param('useremail') useremail: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    const { currentPassword, newPassword } = updatePasswordDto;

    await this.userService.updatePassword(
      useremail,
      currentPassword,
      newPassword,
    );

    return {
      message: 'Password updated successfully',
    };
  }

  /**
   * Update user role (admin only)
   */
  @Put('role/:useremail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async updateRole(
    @Param('useremail') useremail: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    const { newRole } = updateRoleDto;

    const user = await this.userService.updateUserRole(useremail, newRole);

    return {
      message: 'Role updated successfully',
      user: {
        id: user._id,
        useremail: user.useremail,
        role: user.role,
      },
    };
  }

  /**
   * Delete user (admin only)
   */
  @Delete(':useremail')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('useremail') useremail: string) {
    await this.userService.deleteUser(useremail);
    return {
      message: 'User deleted successfully',
    };
  }
}