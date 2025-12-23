import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../companies/company.schema';
import { KYC } from '../kyc/kyc.schema';
import * as fs from 'fs';
import * as path from 'path';

export enum UploadCategory {
  COMPANY_DOCUMENTS = 'company-documents',
  KYC_DOCUMENTS = 'kyc-documents',
  PROFILE_PICTURES = 'profile-pictures',
  INVOICES = 'invoices',
  CONTRACTS = 'contracts',
  REPORTS = 'reports',
}

export interface UploadResult {
  fileName: string;
  originalName: string;
  filePath: string;
  publicUrl: string;
  size: number;
  mimeType: string;
  category: UploadCategory;
  uploadedAt: Date;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  // Allowed file types per category
  private readonly allowedMimeTypes = {
    [UploadCategory.COMPANY_DOCUMENTS]: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
    ],
    [UploadCategory.KYC_DOCUMENTS]: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ],
    [UploadCategory.PROFILE_PICTURES]: [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ],
    [UploadCategory.INVOICES]: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    [UploadCategory.CONTRACTS]: ['application/pdf'],
    [UploadCategory.REPORTS]: [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
  };

  // File size limits per category (in bytes)
  private readonly sizeLimits = {
    [UploadCategory.COMPANY_DOCUMENTS]: 10 * 1024 * 1024, // 10MB
    [UploadCategory.KYC_DOCUMENTS]: 5 * 1024 * 1024, // 5MB
    [UploadCategory.PROFILE_PICTURES]: 2 * 1024 * 1024, // 2MB
    [UploadCategory.INVOICES]: 10 * 1024 * 1024, // 10MB
    [UploadCategory.CONTRACTS]: 10 * 1024 * 1024, // 10MB
    [UploadCategory.REPORTS]: 15 * 1024 * 1024, // 15MB
  };

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(KYC.name) private readonly kycModel: Model<KYC>,
  ) {
    this.ensureUploadDirectories();
  }

  /**
   * Ensure all upload directories exist
   */
  private ensureUploadDirectories(): void {
    Object.values(UploadCategory).forEach((category) => {
      const dir = path.join(this.uploadDir, category);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Validate file before upload
   */
  private validateFile(
    file: Express.Multer.File,
    category: UploadCategory,
  ): void {
    // Check mime type
    const allowedTypes = this.allowedMimeTypes[category];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} not allowed for ${category}. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    // Check file size
    const sizeLimit = this.sizeLimits[category];
    if (file.size > sizeLimit) {
      throw new BadRequestException(
        `File size exceeds limit of ${sizeLimit / (1024 * 1024)}MB for ${category}`,
      );
    }
  }

  /**
   * Universal upload method - saves file to disk
   */
  async uploadFile(
    file: Express.Multer.File,
    category: UploadCategory,
    metadata?: any,
  ): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file, category);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const categoryDir = path.join(this.uploadDir, category);
      const filePath = path.join(categoryDir, fileName);

      // Save file to disk
      fs.writeFileSync(filePath, file.buffer);

      // Generate public URL (adjust based on your setup)
      const publicUrl = `/uploads/${category}/${fileName}`;

      this.logger.log(`File uploaded: ${fileName} (${category})`);

      return {
        fileName,
        originalName: file.originalname,
        filePath,
        publicUrl,
        size: file.size,
        mimeType: file.mimetype,
        category,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    category: UploadCategory,
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file, category);
      results.push(result);
    }

    return results;
  }

  /**
   * Upload company document
   */
  async uploadCompanyDocument(
    companyId: string,
    file: Express.Multer.File,
    documentType: string,
  ): Promise<any> {
    try {
      // Verify company exists
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Upload file
      const uploadResult = await this.uploadFile(
        file,
        UploadCategory.COMPANY_DOCUMENTS,
      );

      // Create document entry
      const documentEntry = {
        name: file.originalname,
        type: documentType,
        fileName: uploadResult.fileName,
        path: uploadResult.filePath,
        url: uploadResult.publicUrl,
        size: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
      };

      // Update company documents array
      await this.companyModel.findByIdAndUpdate(companyId, {
        $push: { documents: documentEntry },
      });

      this.logger.log(
        `Document uploaded for company ${companyId}: ${file.originalname}`,
      );

      return {
        success: true,
        message: 'Document uploaded successfully',
        document: documentEntry,
      };
    } catch (error) {
      this.logger.error(`Failed to upload company document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload KYC documents (front and back)
   */
  async uploadKYCDocuments(
    userId: string,
    frontImage: Express.Multer.File,
    backImage: Express.Multer.File,
  ): Promise<{ frontImageUrl: string; backImageUrl: string }> {
    try {
      // Upload front image
      const frontResult = await this.uploadFile(
        frontImage,
        UploadCategory.KYC_DOCUMENTS,
      );

      // Upload back image
      const backResult = await this.uploadFile(
        backImage,
        UploadCategory.KYC_DOCUMENTS,
      );

      this.logger.log(`KYC documents uploaded for user ${userId}`);

      return {
        frontImageUrl: frontResult.publicUrl,
        backImageUrl: backResult.publicUrl,
      };
    } catch (error) {
      this.logger.error(`Failed to upload KYC documents: ${error.message}`);
      
      // Cleanup: delete already uploaded file if second upload fails
      // This ensures we don't have orphaned files
      throw error;
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<UploadResult> {
    try {
      const result = await this.uploadFile(
        file,
        UploadCategory.PROFILE_PICTURES,
      );

      this.logger.log(`Profile picture uploaded for user ${userId}`);

      return result;
    } catch (error) {
      this.logger.error(`Failed to upload profile picture: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get file from disk
   */
  async getFile(category: UploadCategory, fileName: string): Promise<Buffer> {
    try {
      const filePath = path.join(this.uploadDir, category, fileName);

      if (!fs.existsSync(filePath)) {
        throw new NotFoundException('File not found');
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      this.logger.error(`Failed to get file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete file from disk
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete company document
   */
  async deleteCompanyDocument(
    companyId: string,
    documentId: string,
  ): Promise<any> {
    try {
      const company = await this.companyModel.findById(companyId);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const documentIndex = company.documents.findIndex(
        (doc: any) => doc._id.toString() === documentId,
      );

      if (documentIndex === -1) {
        throw new NotFoundException('Document not found');
      }

      const document = company.documents[documentIndex];

      // Delete file from disk
      await this.deleteFile(document.path!);

      // Remove from database
      company.documents.splice(documentIndex, 1);
      await company.save();

      this.logger.log(
        `Document deleted for company ${companyId}: ${document.name}`,
      );

      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete company document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete KYC documents
   */
  async deleteKYCDocuments(kycId: string): Promise<void> {
    try {
      const kyc = await this.kycModel.findById(kycId);
      if (!kyc) {
        throw new NotFoundException('KYC record not found');
      }

      // Extract file paths from URLs
      const frontPath = path.join(
        this.uploadDir,
        kyc.frontImageUrl.replace('/uploads/', ''),
      );
      const backPath = path.join(
        this.uploadDir,
        kyc.backImageUrl.replace('/uploads/', ''),
      );

      // Delete both files
      await this.deleteFile(frontPath);
      await this.deleteFile(backPath);

      this.logger.log(`KYC documents deleted for KYC ${kycId}`);
    } catch (error) {
      this.logger.error(`Failed to delete KYC documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get company documents
   */
  async getCompanyDocuments(companyId: string): Promise<any[]> {
    try {
      const company = await this.companyModel
        .findById(companyId)
        .select('documents');
      
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      return company.documents || [];
    } catch (error) {
      this.logger.error(`Failed to get company documents: ${error.message}`);
      throw error;
    }
  }

  /**
   * Clean up orphaned files (files not referenced in database)
   * Run this periodically as a cron job
   */
  async cleanupOrphanedFiles(): Promise<{ deletedCount: number }> {
    let deletedCount = 0;

    try {
      // Get all companies and their document file names
      const companies = await this.companyModel.find().select('documents');
      const referencedCompanyFiles = new Set<string>();
      
      companies.forEach((company) => {
        company.documents?.forEach((doc: any) => {
          if (doc.fileName) {
            referencedCompanyFiles.add(doc.fileName);
          }
        });
      });

      // Get all KYC documents
      const kycDocs = await this.kycModel
        .find()
        .select('frontImageUrl backImageUrl');
      const referencedKYCFiles = new Set<string>();
      
      kycDocs.forEach((kyc) => {
        if (kyc.frontImageUrl) {
          const fileName = path.basename(kyc.frontImageUrl);
          referencedKYCFiles.add(fileName);
        }
        if (kyc.backImageUrl) {
          const fileName = path.basename(kyc.backImageUrl);
          referencedKYCFiles.add(fileName);
        }
      });

      // Check company documents directory
      const companyDocsDir = path.join(
        this.uploadDir,
        UploadCategory.COMPANY_DOCUMENTS,
      );
      if (fs.existsSync(companyDocsDir)) {
        const files = fs.readdirSync(companyDocsDir);
        for (const file of files) {
          if (!referencedCompanyFiles.has(file)) {
            const filePath = path.join(companyDocsDir, file);
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }

      // Check KYC documents directory
      const kycDocsDir = path.join(
        this.uploadDir,
        UploadCategory.KYC_DOCUMENTS,
      );
      if (fs.existsSync(kycDocsDir)) {
        const files = fs.readdirSync(kycDocsDir);
        for (const file of files) {
          if (!referencedKYCFiles.has(file)) {
            const filePath = path.join(kycDocsDir, file);
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }

      this.logger.log(`Cleaned up ${deletedCount} orphaned files`);

      return { deletedCount };
    } catch (error) {
      this.logger.error(`Failed to cleanup orphaned files: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    try {
      const stats = {
        totalSize: 0,
        categorySizes: {} as Record<UploadCategory, number>,
        fileCount: 0,
      };

      Object.values(UploadCategory).forEach((category) => {
        const categoryDir = path.join(this.uploadDir, category);
        let categorySize = 0;
        let fileCount = 0;

        if (fs.existsSync(categoryDir)) {
          const files = fs.readdirSync(categoryDir);
          fileCount = files.length;

          files.forEach((file) => {
            const filePath = path.join(categoryDir, file);
            const fileStats = fs.statSync(filePath);
            categorySize += fileStats.size;
          });
        }

        stats.categorySizes[category] = categorySize;
        stats.totalSize += categorySize;
        stats.fileCount += fileCount;
      });

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get storage stats: ${error.message}`);
      throw error;
    }
  }
}




