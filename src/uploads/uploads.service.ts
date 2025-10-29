import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../companies/company.schema';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
  ) {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Upload a document for a company
   */
  async uploadDocument(
    companyId: string,
    file: Express.Multer.File,
    documentType: string,
  ): Promise<any> {
    try {
      // Verify company exists
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const filePath = path.join(this.uploadDir, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Update company documents array
      const documentEntry = {
        name: file.originalname,
        type: documentType,
        fileName: fileName,
        path: filePath,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };

      await this.companyModel.findByIdAndUpdate(companyId, {
        $push: { documents: documentEntry },
      });

      this.logger.log(
        `Document uploaded for company ${companyId}: ${file.originalname}`,
      );

      return {
        message: 'Document uploaded successfully',
        document: documentEntry,
      };
    } catch (error) {
      this.logger.error(`Failed to upload document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get documents for a company
   */
  async getCompanyDocuments(companyId: string): Promise<any[]> {
    try {
      const company = await this.companyModel
        .findById(companyId)
        .select('documents');
      if (!company) {
        throw new Error('Company not found');
      }

      return company.documents || [];
    } catch (error) {
      this.logger.error(`Failed to get company documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(companyId: string, documentId: string): Promise<any> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new Error('Company not found');
      }

      const documentIndex = company.documents.findIndex(
        (doc: any) => doc._id.toString() === documentId,
      );

      if (documentIndex === -1) {
        throw new Error('Document not found');
      }

      const document = company.documents[documentIndex];

      // Delete file from disk
      if (fs.existsSync(document.path!)) {
        fs.unlinkSync(document.path!);
      }

      // Remove from database
      company.documents.splice(documentIndex, 1);
      await company.save();

      this.logger.log(
        `Document deleted for company ${companyId}: ${document.name}`,
      );

      return {
        message: 'Document deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete document: ${error.message}`);
      throw error;
    }
  }
}
