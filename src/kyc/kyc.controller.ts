import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { KYCService } from './kyc.service';
import { UploadsService } from '../uploads/uploads.service';
import { SubmitKYCDto, ReviewKYCDto, KYCQueryDto } from './dto/kyc.dto';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('kyc')
export class KYCController {
  constructor(
    private readonly kycService: KYCService,
    private readonly uploadsService: UploadsService,
  ) {}

  /**
   * Submit KYC application with document uploads
   */
  @Post('submit')
  // @UseGuards(JwtAuthGuard)
 @UseInterceptors(
  FileFieldsInterceptor([
    { name: 'frontImage', maxCount: 1 },
    { name: 'backImage', maxCount: 1 },
  ]),
)
async submitKYC(
  @Body() dto: SubmitKYCDto,
  @UploadedFiles() files: {
    frontImage?: Express.Multer.File[];
    backImage?: Express.Multer.File[];
  },
) {
  if (!files.frontImage || !files.backImage) {
    throw new BadRequestException('Both front and back images are required');
  }

  // Use the upload service
  const { frontImageUrl, backImageUrl } =
    await this.uploadsService.uploadKYCDocuments(
      dto.userId,
      files.frontImage[0],
      files.backImage[0],
    );

  const result = await this.kycService.submitKYC(
    dto,
    frontImageUrl,
    backImageUrl,
  );

  return {
    success: true,
    message: 'KYC submitted successfully',
    data: result,
  };
}

  
  /**
   * Get KYC status by user ID (recommended)
   */
  @Get('status/user/:userId')
  // @UseGuards(JwtAuthGuard)
  async getKYCStatusByUserId(@Param('userId') userId: string) {
    const result = await this.kycService.getKYCByUserId(userId);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get KYC status by email (fallback)
   */
  @Get('status/email/:email')
  // @UseGuards(JwtAuthGuard)
  async getKYCStatusByEmail(@Param('email') email: string) {
    const result = await this.kycService.getKYCByEmail(email);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Check if user has approved KYC
   */
  @Get('check/:userId')
  async checkKYCApproval(@Param('userId') userId: string) {
    const isApproved = await this.kycService.isKYCApproved(userId);
    return {
      success: true,
      isApproved,
    };
  }

  /**
   * Get all KYC submissions (admin only)
   */
  @Get('all')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'auditor')
  async getAllKYC(@Query() query: KYCQueryDto) {
    const results = await this.kycService.getAllKYC(query);
    return {
      success: true,
      count: results.length,
      data: results,
    };
  }

  /**
   * Get KYC statistics (admin only)
   */
  @Get('stats')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async getKYCStats() {
    const stats = await this.kycService.getKYCStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Review KYC submission (admin only)
   */
  @Put('review/:id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin', 'auditor')
  async reviewKYC(
    @Param('id') id: string,
    @Body() dto: ReviewKYCDto,
  ) {
    const result = await this.kycService.reviewKYC(id, dto);
    return {
      success: true,
      message: 'KYC reviewed successfully',
      data: result,
    };
  }

  /**
   * Delete KYC submission (admin only)
   */
  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async deleteKYC(@Param('id') id: string) {
    await this.kycService.deleteKYC(id);
    return {
      success: true,
      message: 'KYC deleted successfully',
    };
  }
}
