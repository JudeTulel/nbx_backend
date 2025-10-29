import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  /**
   * POST /uploads/companies/:companyId/documents
   * Uploads a document for a company
   */
  @Post('companies/:companyId/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('companyId') companyId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!documentType) {
      throw new BadRequestException('Document type is required');
    }

    return await this.uploadsService.uploadDocument(
      companyId,
      file,
      documentType,
    );
  }

  /**
   * GET /uploads/companies/:companyId/documents
   * Gets all documents for a company
   */
  @Get('companies/:companyId/documents')
  async getCompanyDocuments(@Param('companyId') companyId: string) {
    return await this.uploadsService.getCompanyDocuments(companyId);
  }

  /**
   * DELETE /uploads/companies/:companyId/documents/:documentId
   * Deletes a document for a company
   */
  @Delete('companies/:companyId/documents/:documentId')
  async deleteDocument(
    @Param('companyId') companyId: string,
    @Param('documentId') documentId: string,
  ) {
    return await this.uploadsService.deleteDocument(companyId, documentId);
  }
}
