import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /**
   * Creates a new user with their Hedera account ID from wallet.
   */
  async createUser(
    useremail: string,
    password: string,
    hederaAccountId: string,
    role: string = 'investor',
    isKYC: boolean = false
  ): Promise<User> {
    try {
      // Validate inputs
      if (!useremail || !password || !hederaAccountId) {
        throw new BadRequestException('Email, password, and Hedera account ID are required.');
      }

      // Validate Hedera account ID format (e.g., 0.0.12345)
      const accountIdPattern = /^\d+\.\d+\.\d+$/;
      if (!accountIdPattern.test(hederaAccountId)) {
        throw new BadRequestException('Invalid Hedera account ID format.');
      }

      // Check if user already exists
      const existingUser = await this.userModel.findOne({ useremail }).exec();
      if (existingUser) {
        throw new BadRequestException('User with this email already exists.');
      }

      // Check if Hedera account is already registered
      const existingAccount = await this.userModel.findOne({ hederaAccountId }).exec();
      if (existingAccount) {
        throw new BadRequestException('This Hedera account is already registered.');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create and save the user in MongoDB
      const newUser = new this.userModel({
        useremail,
        passwordHash,
        role,
        hederaAccountId,
      });

      return await newUser.save();
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user account.');
    }
  }

  /**
   * Finds a user by email.
   */
  async findOne(useremail: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ useremail }).select('+passwordHash').exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user ${useremail}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  /**
   * Finds a user by Hedera account ID.
   */
  async findByHederaAccount(hederaAccountId: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ hederaAccountId }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      this.logger.error(`Failed to find user by Hedera account: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user');
    }
  }

  /**
   * Updates a user's password.
   */
  async updatePassword(
    useremail: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<User> {
    try {
      const user = await this.userModel.findOne({ useremail }).select('+passwordHash').exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify current password
      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash,
      );

      if (!isCurrentValid) {
        throw new UnauthorizedException('Invalid current password');
      }

      // Validate new password
      if (newPassword.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters');
      }

      // Hash and update new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      user.passwordHash = newPasswordHash;

      return await user.save();
    } catch (error) {
      this.logger.error(`Failed to update password for user ${useremail}: ${error.message}`);
      if (error instanceof NotFoundException || error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update password');
    }
  }

  /**
   * Updates a user's role.
   */
  async updateUserRole(useremail: string, newRole: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ useremail }).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Validate role
      const validRoles = ['investor', 'company', 'auditor', 'admin'];
      if (!validRoles.includes(newRole)) {
        throw new BadRequestException('Invalid role');
      }

      user.role = newRole;
      return await user.save();
    } catch (error) {
      this.logger.error(
        `Failed to update role for user ${useremail}: ${error.message}`,
      );
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user role');
    }
  }

  /**
   * Logs a user in by verifying their credentials.
   */
  async login(useremail: string, password: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ useremail }).select('+passwordHash').exec();
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedException('Invalid credentials');
      }

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Login failed for user ${useremail}: ${error.message}`);
      throw new InternalServerErrorException('Login failed');
    }
  }

  /**
   * Gets user profile information (excludes sensitive data).
   */
  async getUserProfile(useremail: string): Promise<Partial<User>> {
    try {
      const user = await this.userModel
        .findOne({ useremail })
        .select('-passwordHash -__v')
        .exec();
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      this.logger.error(`Failed to get profile for user ${useremail}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve user profile');
    }
  }

  /**
   * Deletes a user account.
   */
  async deleteUser(useremail: string): Promise<void> {
    try {
      const result = await this.userModel.deleteOne({ useremail }).exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException('User not found');
      }
    } catch (error) {
      this.logger.error(`Failed to delete user ${useremail}: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete user');
    }
  }
}