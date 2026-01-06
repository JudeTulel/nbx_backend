// ============================================
// UPDATED COMPANIES SERVICE (companies.service.ts)
// ============================================
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company } from './company.schema';
import { Equity } from './equity.schema';
import { Bond } from './bond.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateEquityDto } from './dto/create-equity.dto';
import { CreateBondDto } from './dto/create-bond.dto';
import { UploadsService, UploadCategory } from '../uploads/uploads.service';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
    @InjectModel(Equity.name)
    private readonly equityModel: Model<Equity>,
    @InjectModel(Bond.name)
    private readonly bondModel: Model<Bond>,
    private readonly uploadsService: UploadsService,
  ) { }

  /**
   * Creates a new company with document uploads
   */
  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    try {
      // Validate required fields
      if (!createCompanyDto.name || !createCompanyDto.ticker || !createCompanyDto.useremail) {
        throw new BadRequestException('Name, ticker, and useremail are required');
      }

      // Validate required documents are provided
      if (!createCompanyDto.certificateOfIncorporation ||
        !createCompanyDto.cr12 ||
        !createCompanyDto.memArts) {
        throw new BadRequestException('All required documents must be provided');
      }

      // Create company first to get the ID
      const newCompany = new this.companyModel({
        name: createCompanyDto.name,
        useremail: createCompanyDto.useremail,
        ticker: createCompanyDto.ticker,
        symbol: createCompanyDto.ticker.toUpperCase(),
        sector: createCompanyDto.sector,
        description: createCompanyDto.description,
        marketCap: createCompanyDto.marketCap,
        price: createCompanyDto.price || 0,
        totalSupply: '0',
        circulatingSupply: '0',
        documents: [], // Will be populated after upload
        highlights: createCompanyDto.highlights || [],
        team: createCompanyDto.team || [],
        priceHistory: createCompanyDto.priceHistory || [],
      });

      const savedCompany = await newCompany.save();

      // Upload documents using the upload service
      const documents: any[] = [];

      try {
        // Upload Certificate of Incorporation
        const incorpResult = await this.uploadsService.uploadFile(
          createCompanyDto.certificateOfIncorporation as any,
          UploadCategory.COMPANY_DOCUMENTS,
        );
        documents.push({
          name: 'Certificate of Incorporation',
          type: 'incorporation',
          fileName: incorpResult.fileName,
          path: incorpResult.filePath,
          url: incorpResult.publicUrl,
          size: incorpResult.size,
          mimeType: incorpResult.mimeType,
          uploadedAt: incorpResult.uploadedAt,
        });

        // Upload CR12
        const cr12Result = await this.uploadsService.uploadFile(
          createCompanyDto.cr12 as any,
          UploadCategory.COMPANY_DOCUMENTS,
        );
        documents.push({
          name: 'CR12 (Official Search Report)',
          type: 'cr12',
          fileName: cr12Result.fileName,
          path: cr12Result.filePath,
          url: cr12Result.publicUrl,
          size: cr12Result.size,
          mimeType: cr12Result.mimeType,
          uploadedAt: cr12Result.uploadedAt,
        });

        // Upload Memorandum & Articles
        const memArtsResult = await this.uploadsService.uploadFile(
          createCompanyDto.memArts as any,
          UploadCategory.COMPANY_DOCUMENTS,
        );
        documents.push({
          name: 'Memorandum & Articles of Association',
          type: 'memarts',
          fileName: memArtsResult.fileName,
          path: memArtsResult.filePath,
          url: memArtsResult.publicUrl,
          size: memArtsResult.size,
          mimeType: memArtsResult.mimeType,
          uploadedAt: memArtsResult.uploadedAt,
        });

        // Upload other documents if provided
        if (createCompanyDto.otherDocs && Array.isArray(createCompanyDto.otherDocs)) {
          for (let i = 0; i < createCompanyDto.otherDocs.length; i++) {
            const file = createCompanyDto.otherDocs[i];
            const result = await this.uploadsService.uploadFile(
              file as any,
              UploadCategory.COMPANY_DOCUMENTS,
            );
            documents.push({
              name: `Additional Document ${i + 1}`,
              type: 'other',
              fileName: result.fileName,
              path: result.filePath,
              url: result.publicUrl,
              size: result.size,
              mimeType: result.mimeType,
              uploadedAt: result.uploadedAt,
            });
          }
        }

        // Update company with documents
        savedCompany.documents = documents;
        await savedCompany.save();

        this.logger.log(`Company created successfully: ${savedCompany.name} (ID: ${savedCompany._id})`);

        return savedCompany;
      } catch (uploadError: any) {
        // If upload fails, delete the company and cleanup any uploaded files
        this.logger.error(`Upload failed, cleaning up company: ${uploadError.message}`);
        await this.companyModel.findByIdAndDelete(savedCompany._id).exec();

        // Cleanup any successfully uploaded documents
        for (const doc of documents) {
          try {
            await this.uploadsService.deleteFile(doc.path);
          } catch (cleanupError) {
            this.logger.warn(`Failed to cleanup file: ${doc.path}`);
          }
        }

        throw new InternalServerErrorException('Failed to upload company documents');
      }
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new BadRequestException(
          `Company with this ${field} already exists`,
        );
      }

      if (error instanceof BadRequestException ||
        error instanceof InternalServerErrorException) {
        throw error;
      }

      this.logger.error(`Failed to create company: ${error.message}`);
      throw new InternalServerErrorException('Failed to create company');
    }
  }

  /**
   * Retrieves all companies with optional filtering and pagination
   */
  async findAll(
    skip = 0,
    limit = 10,
    sector?: string,
  ): Promise<{ companies: Company[]; total: number }> {
    try {
      const filter = sector ? { sector } : {};
      const companies = await this.companyModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .exec();
      const total = await this.companyModel.countDocuments(filter).exec();
      return { companies, total };
    } catch (error: any) {
      this.logger.error(`Failed to retrieve companies: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve companies');
    }
  }

  /**
   * Retrieves a single company by ID
   */
  async findOne(id: string): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
      return company;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to find company: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve company');
    }
  }

  /**
   * Retrieves a company by symbol
   */
  async findBySymbol(symbol: string): Promise<Company> {
    try {
      const company = await this.companyModel.findOne({ symbol }).exec();
      if (!company) {
        throw new NotFoundException(`Company with symbol ${symbol} not found`);
      }
      return company;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to find company by symbol: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve company');
    }
  }

  /**
   * Retrieves companies by user email
   */
  async findByUserEmail(useremail: string): Promise<Company[]> {
    try {
      const companies = await this.companyModel
        .find({ useremail })
        .sort({ createdAt: -1 })
        .exec();
      return companies;
    } catch (error: any) {
      this.logger.error(`Failed to find companies by user: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve user companies');
    }
  }

  /**
   * Updates a company by ID
   */
  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<Company> {
    try {
      const company = await this.companyModel
        .findByIdAndUpdate(id, updateCompanyDto, { new: true })
        .exec();

      if (!company) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }

      this.logger.log(`Company updated successfully: ${company.name} (ID: ${id})`);

      return company;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new BadRequestException(
          `Company with this ${field} already exists`,
        );
      }
      this.logger.error(`Failed to update company: ${error.message}`);
      throw new InternalServerErrorException('Failed to update company');
    }
  }

  /**
   * Add a document to an existing company
   */
  async addDocument(
    companyId: string,
    file: Express.Multer.File,
    documentType: string,
    documentName?: string,
  ): Promise<Company> {
    try {
      const company = await this.companyModel.findById(companyId).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      // Upload the file
      const uploadResult = await this.uploadsService.uploadFile(
        file,
        UploadCategory.COMPANY_DOCUMENTS,
      );

      // Add document to company
      const documentEntry = {
        name: documentName || file.originalname,
        type: documentType,
        fileName: uploadResult.fileName,
        path: uploadResult.filePath,
        url: uploadResult.publicUrl,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
        uploadedAt: uploadResult.uploadedAt,
      };

      company.documents.push(documentEntry);
      await company.save();

      this.logger.log(`Document added to company ${companyId}: ${documentName || file.originalname}`);

      return company;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to add document: ${error.message}`);
      throw new InternalServerErrorException('Failed to add document to company');
    }
  }

  /**
   * Remove a document from a company
   */
  async removeDocument(companyId: string, documentId: string): Promise<Company> {
    try {
      const company = await this.companyModel.findById(companyId).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      const documentIndex = company.documents.findIndex(
        (doc: any) => doc._id.toString() === documentId,
      );

      if (documentIndex === -1) {
        throw new NotFoundException('Document not found');
      }

      const document = company.documents[documentIndex];

      // Delete file from disk using upload service
      try {
        await this.uploadsService.deleteFile(document.path!);
      } catch (deleteError) {
        this.logger.warn(`Failed to delete file from disk: ${document.path}`);
      }

      // Remove from database
      company.documents.splice(documentIndex, 1);
      await company.save();

      this.logger.log(`Document removed from company ${companyId}: ${document.name}`);

      return company;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to remove document: ${error.message}`);
      throw new InternalServerErrorException('Failed to remove document');
    }
  }

  /**
   * Deletes a company by ID (includes cleanup of all documents)
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const company = await this.companyModel.findById(id).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }

      // Delete all company documents from disk
      if (company.documents && company.documents.length > 0) {
        for (const doc of company.documents) {
          try {
            await this.uploadsService.deleteFile(doc.path!);
          } catch (deleteError) {
            this.logger.warn(`Failed to delete file: ${doc.path}`);
          }
        }
      }

      // Delete company from database
      await this.companyModel.findByIdAndDelete(id).exec();

      this.logger.log(`Company deleted successfully: ${company.name} (ID: ${id})`);

      return { message: `Company ${company.name} deleted successfully` };
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to delete company: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete company');
    }
  }

  /**
   * Updates price history for a company
   */
  async updatePriceHistory(
    id: string,
    priceEntry: { date: string; price: number },
  ): Promise<Company> {
    try {
      const company = await this.companyModel.findById(id).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }

      company.priceHistory.push(priceEntry);
      await company.save();

      this.logger.log(`Price history updated for company ${id}: ${priceEntry.price} on ${priceEntry.date}`);

      return company;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update price history: ${error.message}`);
      throw new InternalServerErrorException('Failed to update price history');
    }
  }

  /**
   * Get company statistics
   */
  async getCompanyStats(): Promise<any> {
    try {
      const [total, bySector, recentCompanies] = await Promise.all([
        this.companyModel.countDocuments().exec(),
        this.companyModel.aggregate([
          {
            $group: {
              _id: '$sector',
              count: { $sum: 1 },
            },
          },
        ]),
        this.companyModel
          .find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('name ticker sector createdAt')
          .exec(),
      ]);

      return {
        total,
        bySector: bySector.reduce((acc: any, item: any) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentCompanies,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get company stats: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve company statistics');
    }
  }

  // ============================================
  // EQUITY METHODS
  // ============================================

  /**
   * Create an equity token for a company
   */
  async createEquity(companyId: string, createEquityDto: CreateEquityDto): Promise<Equity> {
    try {
      // Verify company exists
      const company = await this.companyModel.findById(companyId).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      // Create equity record
      const equity = new this.equityModel({
        ...createEquityDto,
        companyId: new Types.ObjectId(companyId),
        tokenizedAt: createEquityDto.tokenizedAt ? new Date(createEquityDto.tokenizedAt) : new Date(),
      });

      const savedEquity = await equity.save();

      // Update company tokenization status
      await this.companyModel.findByIdAndUpdate(companyId, {
        isTokenized: true,
        tokenId: createEquityDto.assetAddress,
      });

      this.logger.log(`Equity created for company ${companyId}: ${savedEquity.name} (${savedEquity.assetAddress})`);

      return savedEquity;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to create equity: ${error.message}`);
      throw new InternalServerErrorException('Failed to create equity');
    }
  }

  /**
   * Get all equities for a company
   */
  async findEquitiesByCompany(companyId: string): Promise<Equity[]> {
    try {
      const equities = await this.equityModel
        .find({ companyId: new Types.ObjectId(companyId) })
        .sort({ createdAt: -1 })
        .exec();
      return equities;
    } catch (error: any) {
      this.logger.error(`Failed to find equities: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve equities');
    }
  }

  /**
   * Get a single equity by ID
   */
  async findEquityById(equityId: string): Promise<Equity> {
    try {
      const equity = await this.equityModel.findById(equityId).exec();
      if (!equity) {
        throw new NotFoundException(`Equity with ID ${equityId} not found`);
      }
      return equity;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to find equity: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve equity');
    }
  }

  // ============================================
  // BOND METHODS
  // ============================================

  /**
   * Create a bond token for a company
   */
  async createBond(companyId: string, createBondDto: CreateBondDto): Promise<Bond> {
    try {
      // Verify company exists
      const company = await this.companyModel.findById(companyId).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      // Create bond record
      const bond = new this.bondModel({
        ...createBondDto,
        companyId: new Types.ObjectId(companyId),
        tokenizedAt: createBondDto.tokenizedAt ? new Date(createBondDto.tokenizedAt) : new Date(),
      });

      const savedBond = await bond.save();

      this.logger.log(`Bond created for company ${companyId}: ${savedBond.name} (${savedBond.assetAddress})`);

      return savedBond;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to create bond: ${error.message}`);
      throw new InternalServerErrorException('Failed to create bond');
    }
  }

  /**
   * Get all bonds for a company
   */
  async findBondsByCompany(companyId: string): Promise<Bond[]> {
    try {
      const bonds = await this.bondModel
        .find({ companyId: new Types.ObjectId(companyId) })
        .sort({ createdAt: -1 })
        .exec();
      return bonds;
    } catch (error: any) {
      this.logger.error(`Failed to find bonds: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve bonds');
    }
  }

  /**
   * Get a single bond by ID
   */
  async findBondById(bondId: string): Promise<Bond> {
    try {
      const bond = await this.bondModel.findById(bondId).exec();
      if (!bond) {
        throw new NotFoundException(`Bond with ID ${bondId} not found`);
      }
      return bond;
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to find bond: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve bond');
    }
  }
}
