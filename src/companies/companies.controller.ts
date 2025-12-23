import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
  ) {}

  /**
   * POST /companies
   * Creates a new company with document uploads
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'certificateOfIncorporation', maxCount: 1 },
      { name: 'cr12', maxCount: 1 },
      { name: 'memArts', maxCount: 1 },
      { name: 'otherDocs', maxCount: 10 },
    ], {
      fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Invalid file type: ${fileExtension}. Allowed types: ${allowedExtensions.join(', ')}`), false);
        }
      },
      limits: { 
        fileSize: 10 * 1024 * 1024, // 10MB per file
      },
    }),
  )
  async create(
    @Body() body: CreateCompanyDto,
    @UploadedFiles() files: {
      certificateOfIncorporation?: Express.Multer.File[];
      cr12?: Express.Multer.File[];
      memArts?: Express.Multer.File[];
      otherDocs?: Express.Multer.File[];
    },
  ) {
    // Validate required files
    if (!files.certificateOfIncorporation || !files.cr12 || !files.memArts) {
      throw new BadRequestException('All required documents must be uploaded (Certificate of Incorporation, CR12, Memorandum & Articles)');
    }

    // Attach files to DTO
    const createCompanyDto: CreateCompanyDto = {
      ...body,
      certificateOfIncorporation: files.certificateOfIncorporation[0],
      cr12: files.cr12[0],
      memArts: files.memArts[0],
      otherDocs: files.otherDocs || [],
    } as any;

    const company = await this.companiesService.create(createCompanyDto);

    return {
      success: true,
      message: 'Company created successfully',
      data: company,
    };
  }

  /**
   * GET /companies
   * Retrieves all companies with optional filtering and pagination
   */
  @Get()
  async findAll(
    @Query('skip') skip?: string,
    @Query('limit') limit?: string,
    @Query('sector') sector?: string,
  ) {
    const skipNum = skip ? parseInt(skip) : 0;
    const limitNum = limit ? parseInt(limit) : 10;
    
    const result = await this.companiesService.findAll(skipNum, limitNum, sector);
    
    return {
      success: true,
      count: result.companies.length,
      total: result.total,
      data: result.companies,
    };
  }

  /**
   * GET /companies/stats
   * Get company statistics
   */
  @Get('stats')
  async getStats() {
    const stats = await this.companiesService.getCompanyStats();
    return {
      success: true,
      data: stats,
    };
  }

  /**
   * GET /companies/user/:email
   * Get companies by user email
   */
  @UseGuards(JwtAuthGuard)
  @Get('user/:email')
  async findByUser(@Param('email') email: string) {
    const companies = await this.companiesService.findByUserEmail(email);
    return {
      success: true,
      count: companies.length,
      data: companies,
    };
  }

  /**
   * GET /companies/symbol/:symbol
   * Retrieves a company by symbol
   */
  @Get('symbol/:symbol')
  async findBySymbol(@Param('symbol') symbol: string) {
    const company = await this.companiesService.findBySymbol(symbol);
    return {
      success: true,
      data: company,
    };
  }

  /**
   * GET /companies/:id
   * Retrieves a single company by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const company = await this.companiesService.findOne(id);
    return {
      success: true,
      data: company,
    };
  }

  /**
   * PATCH /companies/:id
   * Updates a company by ID
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
  ) {
    const company = await this.companiesService.update(id, updateCompanyDto);
    return {
      success: true,
      message: 'Company updated successfully',
      data: company,
    };
  }

  /**
   * DELETE /companies/:id
   * Deletes a company by ID
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.companiesService.remove(id);
    return {
      success: true,
      ...result,
    };
  }

  /**
   * POST /companies/:id/price-history
   * Updates price history for a company
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/price-history')
  async updatePriceHistory(
    @Param('id') id: string,
    @Body() priceEntry: { date: string; price: number },
  ) {
    const company = await this.companiesService.updatePriceHistory(id, priceEntry);
    return {
      success: true,
      message: 'Price history updated successfully',
      data: company,
    };
  }

  /**
   * POST /companies/:id/documents
   * Add document to existing company
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/documents')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'file', maxCount: 1 }]))
  async addDocument(
    @Param('id') id: string,
    @Body('documentType') documentType: string,
    @Body('documentName') documentName: string,
    @UploadedFiles() files: { file?: Express.Multer.File[] },
  ) {
    if (!files.file || !files.file[0]) {
      throw new BadRequestException('File is required');
    }

    const company = await this.companiesService.addDocument(
      id,
      files.file[0],
      documentType,
      documentName,
    );

    return {
      success: true,
      message: 'Document added successfully',
      data: company,
    };
  }

  /**
   * DELETE /companies/:id/documents/:documentId
   * Remove document from company
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id/documents/:documentId')
  async removeDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    const company = await this.companiesService.removeDocument(id, documentId);
    return {
      success: true,
      message: 'Document removed successfully',
      data: company,
    };
  }
}