import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Company } from '../companies/company.schema';
import { KYC } from '../kyc/kyc.schema';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

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
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly publicBaseUrl?: string;

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
    private readonly configService: ConfigService,
  ) {
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET') || '';
    this.publicBaseUrl = this.configService.get<string>('AWS_S3_PUBLIC_BASE_URL');

    const s3Config: S3ClientConfig = {
      region: this.region,
      forcePathStyle:
        (this.configService.get<string>('AWS_S3_FORCE_PATH_STYLE') || 'false').toLowerCase() ===
        'true',
    };

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');
    if (accessKeyId && secretAccessKey) {
      s3Config.credentials = { accessKeyId, secretAccessKey };
    }

    const endpoint = this.configService.get<string>('AWS_S3_ENDPOINT');
    if (endpoint) {
      s3Config.endpoint = endpoint;
    }

    this.s3Client = new S3Client(s3Config);

    if (!this.bucketName) {
      this.logger.warn(
        'AWS_S3_BUCKET is not configured. Upload endpoints will fail until it is set.',
      );
    }

    this.ensureUploadDirectories();
  }

  private ensureS3Configured(): void {
    if (!this.bucketName) {
      throw new InternalServerErrorException('AWS S3 bucket is not configured');
    }
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

  private generateObjectKey(category: UploadCategory, fileName: string): string {
    return `${category}/${fileName}`;
  }

  private buildPublicUrl(key: string): string {
    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl.replace(/\/$/, '')}/${key}`;
    }

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
  }

  private async streamToBuffer(body: unknown): Promise<Buffer> {
    if (!body) {
      throw new NotFoundException('File body is empty');
    }

    if (Buffer.isBuffer(body)) {
      return body;
    }

    if (body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of body) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    throw new InternalServerErrorException('Unsupported S3 object body type');
  }

  private extractObjectKey(value?: string | null): string | null {
    if (!value) {
      return null;
    }

    const normalized = value.replace(/\\/g, '/');

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      try {
        const pathname = decodeURIComponent(new URL(normalized).pathname).replace(/^\/+/, '');
        if (pathname.startsWith(`${this.bucketName}/`)) {
          return pathname.substring(this.bucketName.length + 1);
        }
        return pathname || null;
      } catch {
        return null;
      }
    }

    const uploadsMarker = '/uploads/';
    const uploadsIndex = normalized.lastIndexOf(uploadsMarker);
    if (uploadsIndex >= 0) {
      return normalized.substring(uploadsIndex + uploadsMarker.length);
    }

    for (const category of Object.values(UploadCategory)) {
      const categoryMarker = `/${category}/`;
      const categoryIndex = normalized.lastIndexOf(categoryMarker);
      if (categoryIndex >= 0) {
        return normalized.substring(categoryIndex + 1);
      }
      if (normalized.startsWith(`${category}/`)) {
        return normalized;
      }
    }

    return normalized.includes('/') ? normalized : null;
  }

  private getLegacyLocalPathFromKey(objectKey: string): string {
    return path.join(this.uploadDir, objectKey);
  }

  private async listAllObjects(prefix: string): Promise<Array<{ key: string; size: number }>> {
    this.ensureS3Configured();
    const results: Array<{ key: string; size: number }> = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );

      for (const item of response.Contents || []) {
        if (item.Key) {
          results.push({ key: item.Key, size: item.Size || 0 });
        }
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return results;
  }

  /**
   * Universal upload method - uploads file to S3
   */
  async uploadFile(
    file: Express.Multer.File,
    category: UploadCategory,
    metadata?: any,
  ): Promise<UploadResult> {
    try {
      this.ensureS3Configured();

      // Validate file
      this.validateFile(file, category);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}${fileExtension}`;
      const objectKey = this.generateObjectKey(category, fileName);

      // Upload to S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: file.buffer,
          ContentType: file.mimetype,
          Metadata: metadata,
        }),
      );

      const publicUrl = this.buildPublicUrl(objectKey);

      this.logger.log(`File uploaded: ${fileName} (${category})`);

      return {
        fileName,
        originalName: file.originalname,
        filePath: objectKey,
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
   * Get file from S3
   */
  async getFile(category: UploadCategory, fileName: string): Promise<Buffer> {
    this.ensureS3Configured();

    const objectKey = this.generateObjectKey(category, fileName);
    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
        }),
      );

      return this.streamToBuffer(response.Body);
    } catch (error) {
      const legacyPath = this.getLegacyLocalPathFromKey(objectKey);
      if (fs.existsSync(legacyPath)) {
        return fs.readFileSync(legacyPath);
      }

      if (error?.name === 'NoSuchKey') {
        throw new NotFoundException('File not found');
      }

      this.logger.error(`Failed to get file: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete file from S3 (with legacy local fallback)
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      const objectKey = this.extractObjectKey(filePath);
      if (objectKey) {
        this.ensureS3Configured();
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: objectKey,
          }),
        );
        this.logger.log(`S3 file deleted: ${objectKey}`);
        return;
      }

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Legacy local file deleted: ${filePath}`);
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
      const frontPath = this.extractObjectKey(kyc.frontImageUrl) || '';
      const backPath = this.extractObjectKey(kyc.backImageUrl) || '';

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
   * Clean up orphaned files (S3 objects not referenced in database)
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
          const key =
            this.extractObjectKey(doc.path) ||
            (doc.fileName
              ? this.generateObjectKey(UploadCategory.COMPANY_DOCUMENTS, doc.fileName)
              : null);
          if (key) {
            referencedCompanyFiles.add(key);
          }
        });
      });

      // Get all KYC documents
      const kycDocs = await this.kycModel
        .find()
        .select('frontImageUrl backImageUrl');
      const referencedKYCFiles = new Set<string>();
      
      kycDocs.forEach((kyc) => {
        const frontKey = this.extractObjectKey(kyc.frontImageUrl);
        const backKey = this.extractObjectKey(kyc.backImageUrl);
        if (frontKey) {
          referencedKYCFiles.add(frontKey);
        }
        if (backKey) {
          referencedKYCFiles.add(backKey);
        }
      });

      // Check company documents objects
      const companyObjects = await this.listAllObjects(
        `${UploadCategory.COMPANY_DOCUMENTS}/`,
      );
      for (const object of companyObjects) {
        if (!referencedCompanyFiles.has(object.key)) {
          await this.deleteFile(object.key);
          deletedCount++;
        }
      }

      // Check KYC document objects
      const kycObjects = await this.listAllObjects(
        `${UploadCategory.KYC_DOCUMENTS}/`,
      );
      for (const object of kycObjects) {
        if (!referencedKYCFiles.has(object.key)) {
          await this.deleteFile(object.key);
          deletedCount++;
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
    this.ensureS3Configured();

    try {
      const stats = {
        totalSize: 0,
        categorySizes: {} as Record<UploadCategory, number>,
        fileCount: 0,
      };

      Object.values(UploadCategory).forEach((category) => {
        stats.categorySizes[category] = 0;
      });

      for (const category of Object.values(UploadCategory)) {
        const objects = await this.listAllObjects(`${category}/`);
        const categorySize = objects.reduce((sum, object) => sum + object.size, 0);
        const categoryCount = objects.length;

        stats.categorySizes[category] = categorySize;
        stats.totalSize += categorySize;
        stats.fileCount += categoryCount;
      }

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get storage stats: ${error.message}`);
      throw error;
    }
  }
}




