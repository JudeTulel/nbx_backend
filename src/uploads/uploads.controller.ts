import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import {
  FileInterceptor,
  FileFieldsInterceptor,
} from '@nestjs/platform-express';
import type { Response } from 'express';
import { UploadsService, UploadCategory } from './uploads.service';
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { RolesGuard } from '../auth/guards/roles.guard';
// import { Roles } from '../auth/decorators/roles.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * Upload company document
   */
  @Post('company/:companyId/document')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCompanyDocument(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    if (!documentType) {
      throw new BadRequestException('Document type is required');
    }

    return this.uploadsService.uploadCompanyDocument(
      companyId,
      file,
      documentType,
    );
  }

  /**
   * Upload KYC documents
   */
  @Post('kyc/:userId')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'frontImage', maxCount: 1 },
      { name: 'backImage', maxCount: 1 },
    ]),
  )
  async uploadKYCDocuments(
    @Param('userId') userId: string,
    @UploadedFiles()
    files: {
      frontImage?: Express.Multer.File[];
      backImage?: Express.Multer.File[];
    },
  ) {
    if (!files.frontImage || !files.backImage) {
      throw new BadRequestException('Both front and back images are required');
    }

    const result = await this.uploadsService.uploadKYCDocuments(
      userId,
      files.frontImage[0],
      files.backImage[0],
    );

    return {
      success: true,
      message: 'KYC documents uploaded successfully',
      data: result,
    };
  }

  /**
   * Upload profile picture
   */
  @Post('profile/:userId')
  // @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Param('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    const result = await this.uploadsService.uploadProfilePicture(userId, file);

    return {
      success: true,
      message: 'Profile picture uploaded successfully',
      data: result,
    };
  }

  /**
   * Get file - serves the file with proper content type
   */
  @Get(':category/:fileName')
  async getFile(
    @Param('category') category: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    // Validate category
    if (!Object.values(UploadCategory).includes(category as UploadCategory)) {
      throw new BadRequestException('Invalid upload category');
    }

    const fileBuffer = await this.uploadsService.getFile(
      category as UploadCategory,
      fileName,
    );

    // Set appropriate content type based on file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    const contentType = contentTypes[ext || ''] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    
    res.send(fileBuffer);
  }

  /**
   * Download file - forces download instead of inline display
   */
  @Get(':category/:fileName/download')
  async downloadFile(
    @Param('category') category: string,
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ) {
    if (!Object.values(UploadCategory).includes(category as UploadCategory)) {
      throw new BadRequestException('Invalid upload category');
    }

    const fileBuffer = await this.uploadsService.getFile(
      category as UploadCategory,
      fileName,
    );

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    res.send(fileBuffer);
  }

  /**
   * Get company documents
   */
  @Get('company/:companyId/documents')
  // @UseGuards(JwtAuthGuard)
  async getCompanyDocuments(@Param('companyId') companyId: string) {
    const documents = await this.uploadsService.getCompanyDocuments(companyId);
    return {
      success: true,
      count: documents.length,
      data: documents,
    };
  }

  /**
   * Delete company document
   */
  @Delete('company/:companyId/document/:documentId')
  // @UseGuards(JwtAuthGuard)
  async deleteCompanyDocument(
    @Param('companyId') companyId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.uploadsService.deleteCompanyDocument(companyId, documentId);
  }

  /**
   * Get storage statistics (admin only)
   */
  @Get('admin/stats')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async getStorageStats() {
    const stats = await this.uploadsService.getStorageStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * Cleanup orphaned files (admin only)
   */
  @Post('admin/cleanup')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  async cleanupOrphanedFiles() {
    const result = await this.uploadsService.cleanupOrphanedFiles();
    return {
      success: true,
      message: `Deleted ${result.deletedCount} orphaned files`,
      data: result,
    };
  }

 
}
