import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { KYC, KYCStatus } from './kyc.schema';
import { User } from '../users/users.schema';
import { SubmitKYCDto, ReviewKYCDto, KYCQueryDto } from './dto/kyc.dto';

@Injectable()
export class KYCService {
  private readonly logger = new Logger(KYCService.name);

  constructor(
    @InjectModel(KYC.name) private kycModel: Model<KYC>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Submit a new KYC application
   */
  async submitKYC(
    dto: SubmitKYCDto,
    frontImageUrl: string,
    backImageUrl: string,
  ): Promise<KYC> {
    try {
      // Verify user exists
      const user = await this.userModel.findById(dto.userId).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Verify email matches
      if (user.useremail !== dto.useremail) {
        throw new BadRequestException('Email does not match user account');
      }

      // Check if user already has a KYC submission
      const existing = await this.kycModel.findOne({ 
        userId: new Types.ObjectId(dto.userId)
      }).exec();

      if (existing) {
        // If already approved, don't allow resubmission
        if (existing.status === KYCStatus.APPROVED) {
          throw new ConflictException('KYC already approved for this user');
        }
        
        // If pending or under review, don't allow resubmission
        if (existing.status === KYCStatus.PENDING || 
            existing.status === KYCStatus.UNDER_REVIEW) {
          throw new ConflictException('KYC submission already in progress');
        }

        // If rejected or expired, allow resubmission by updating
        existing.fullName = dto.fullName;
        existing.idNumber = dto.idNumber;
        existing.documentType = dto.documentType || existing.documentType;
        existing.frontImageUrl = frontImageUrl;
        existing.backImageUrl = backImageUrl;
        existing.status = KYCStatus.PENDING;
        existing.rejectionReason = undefined;
        existing.reviewedBy = undefined;
        existing.reviewedAt = undefined;
        existing.submittedAt = new Date();

        const updatedKyc = await existing.save();

        // Update user's KYC status
        await this.updateUserKYCStatus(dto.userId, KYCStatus.PENDING);

        return updatedKyc;
      }

      // Create new KYC submission
      const kyc = new this.kycModel({
        userId: new Types.ObjectId(dto.userId),
        useremail: dto.useremail,
        fullName: dto.fullName,
        idNumber: dto.idNumber,
        documentType: dto.documentType,
        frontImageUrl,
        backImageUrl,
        status: KYCStatus.PENDING,
        submittedAt: new Date(),
      });

      const savedKyc = await kyc.save();

      // Update user's KYC status
      await this.updateUserKYCStatus(dto.userId, KYCStatus.PENDING);

      return savedKyc;
    } catch (error) {
      this.logger.error(`Failed to submit KYC: ${error.message}`);
      if (error instanceof ConflictException || 
          error instanceof BadRequestException ||
          error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to submit KYC application');
    }
  }

  /**
   * Get KYC by user ID (recommended method)
   */
  async getKYCByUserId(userId: string): Promise<KYC> {
    try {
      const kyc = await this.kycModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .populate('userId', 'useremail role hederaAccountId') // Populate user data
        .exec();
      
      if (!kyc) {
        throw new NotFoundException('No KYC submission found for this user');
      }
      return kyc;
    } catch (error) {
      this.logger.error(`Failed to get KYC: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve KYC data');
    }
  }

  /**
   * Get KYC by email (fallback method)
   */
  async getKYCByEmail(useremail: string): Promise<KYC> {
    try {
      const kyc = await this.kycModel
        .findOne({ useremail })
        .populate('userId', 'useremail role hederaAccountId')
        .exec();
      
      if (!kyc) {
        throw new NotFoundException('No KYC submission found for this user');
      }
      return kyc;
    } catch (error) {
      this.logger.error(`Failed to get KYC: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve KYC data');
    }
  }

  /**
   * Get all KYC submissions (admin only)
   */
  async getAllKYC(query: KYCQueryDto): Promise<KYC[]> {
    try {
      const filter: any = {};
      
      if (query.status) {
        filter.status = query.status;
      }
      
      if (query.useremail) {
        filter.useremail = { $regex: query.useremail, $options: 'i' };
      }

      if (query.userId) {
        filter.userId = new Types.ObjectId(query.userId);
      }

      return await this.kycModel
        .find(filter)
        .populate('userId', 'useremail role hederaAccountId')
        .sort({ createdAt: -1 })
        .exec();
    } catch (error) {
      this.logger.error(`Failed to get all KYC: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve KYC submissions');
    }
  }

  /**
   * Review and update KYC status (admin only)
   */
  async reviewKYC(id: string, dto: ReviewKYCDto): Promise<KYC> {
    try {
      const kyc = await this.kycModel.findById(id).exec();
      
      if (!kyc) {
        throw new NotFoundException('KYC submission not found');
      }

      // Validate status transition
      if (kyc.status === KYCStatus.APPROVED && dto.status !== KYCStatus.EXPIRED) {
        throw new BadRequestException('Cannot change status of approved KYC');
      }

      kyc.status = dto.status;
      kyc.reviewedBy = dto.reviewedBy;
      kyc.reviewedAt = new Date();

      if (dto.status === KYCStatus.REJECTED) {
        if (!dto.rejectionReason) {
          throw new BadRequestException('Rejection reason is required');
        }
        kyc.rejectionReason = dto.rejectionReason;
      } else {
        kyc.rejectionReason = undefined;
      }

      // Set expiration date for approved KYC (e.g., 1 year)
      if (dto.status === KYCStatus.APPROVED) {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        kyc.expiresAt = expiryDate;
      }

      const updatedKyc = await kyc.save();

      // Update user's KYC status
      await this.updateUserKYCStatus(kyc.userId.toString(), dto.status);

      return updatedKyc;
    } catch (error) {
      this.logger.error(`Failed to review KYC: ${error.message}`);
      if (error instanceof NotFoundException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to review KYC');
    }
  }

  /**
   * Delete KYC submission (admin only)
   */
  async deleteKYC(id: string): Promise<void> {
    try {
      const kyc = await this.kycModel.findByIdAndDelete(id).exec();
      if (!kyc) {
        throw new NotFoundException('KYC submission not found');
      }

      // Reset user's KYC status
      await this.userModel.findByIdAndUpdate(kyc.userId, {
        kycVerified: false,
        kycStatus: null,
        kycSubmittedAt: null,
        kycApprovedAt: null,
      }).exec();
    } catch (error) {
      this.logger.error(`Failed to delete KYC: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete KYC');
    }
  }

  /**
   * Check if user has approved KYC
   */
  async isKYCApproved(userId: string): Promise<boolean> {
    try {
      const kyc = await this.kycModel.findOne({ 
        userId: new Types.ObjectId(userId),
        status: KYCStatus.APPROVED,
      }).exec();
      
      // Check if KYC is expired
      if (kyc && kyc.expiresAt && kyc.expiresAt < new Date()) {
        kyc.status = KYCStatus.EXPIRED;
        await kyc.save();
        await this.updateUserKYCStatus(userId, KYCStatus.EXPIRED);
        return false;
      }

      return !!kyc;
    } catch (error) {
      this.logger.error(`Failed to check KYC approval: ${error.message}`);
      return false;
    }
  }

  /**
   * Update user's KYC status fields (internal helper)
   */
  private async updateUserKYCStatus(
    userId: string, 
    status: KYCStatus
  ): Promise<void> {
    const updateData: any = {
      kycStatus: status,
    };

    if (status === KYCStatus.PENDING) {
      updateData.kycSubmittedAt = new Date();
      updateData.kycVerified = false;
    } else if (status === KYCStatus.APPROVED) {
      updateData.kycVerified = true;
      updateData.kycApprovedAt = new Date();
    } else if (status === KYCStatus.REJECTED || status === KYCStatus.EXPIRED) {
      updateData.kycVerified = false;
      updateData.kycApprovedAt = null;
    }

    await this.userModel.findByIdAndUpdate(userId, updateData).exec();
  }

  /**
   * Get KYC statistics (admin only)
   */
  async getKYCStats(): Promise<any> {
    try {
      const [total, pending, underReview, approved, rejected, expired] = 
        await Promise.all([
          this.kycModel.countDocuments().exec(),
          this.kycModel.countDocuments({ status: KYCStatus.PENDING }).exec(),
          this.kycModel.countDocuments({ status: KYCStatus.UNDER_REVIEW }).exec(),
          this.kycModel.countDocuments({ status: KYCStatus.APPROVED }).exec(),
          this.kycModel.countDocuments({ status: KYCStatus.REJECTED }).exec(),
          this.kycModel.countDocuments({ status: KYCStatus.EXPIRED }).exec(),
        ]);

      return {
        total,
        pending,
        underReview,
        approved,
        rejected,
        expired,
      };
    } catch (error) {
      this.logger.error(`Failed to get KYC stats: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve KYC statistics');
    }
  }
}
