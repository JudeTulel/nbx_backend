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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { EquityService } from '../equity/equity.service';
import { BondService } from '../bond/bond.service';
import { CreateEquityDto } from '../equity/dto/create-equity.dto';
import { CreateBondDto } from '../bond/dto/create-bond.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { User } from '../users/users.schema';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly equityService: EquityService,
    private readonly bondService: BondService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * POST /companies
   * Creates a new company
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
        if (allowed.includes(extname(file.originalname).toLowerCase())) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type'), false);
        }
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // Map files by fieldname
    const fileMap: Record<string, Express.Multer.File[]> = (files || []).reduce((acc, file) => {
      if (!acc[file.fieldname]) acc[file.fieldname] = [];
      acc[file.fieldname].push(file);
      return acc;
    }, {} as Record<string, Express.Multer.File[]>);

    const createCompanyDto: CreateCompanyDto = {
      ...body,
      certificateOfIncorporation: fileMap.certificateOfIncorporation?.[0],
      cr12: fileMap.cr12?.[0],
      memArts: fileMap.memArts?.[0],
      otherDocs: fileMap.otherDocs || [],
    } as any;

    return await this.companiesService.create(createCompanyDto);
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
    const skipNum = skip ? Number.parseInt(skip) : 0;
    const limitNum = limit ? Number.parseInt(limit) : 10;
    return await this.companiesService.findAll(skipNum, limitNum, sector);
  }

  /**
   * GET /companies/symbol/:symbol
   * Retrieves a company by symbol
   */
  @Get('symbol/:symbol')
  async findBySymbol(@Param('symbol') symbol: string) {
    return await this.companiesService.findBySymbol(symbol);
  }

  /**
   * GET /companies/:id
   * Retrieves a single company by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.companiesService.findOne(id);
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
    return await this.companiesService.update(id, updateCompanyDto);
  }

  /**
   * DELETE /companies/:id
   * Deletes a company by ID
   */
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.companiesService.remove(id);
  }

  /**
   * PATCH /companies/:id/price-history
   * Updates price history for a company
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/price-history')
  async updatePriceHistory(
    @Param('id') id: string,
    @Body() priceEntry: { date: string; price: number },
  ) {
    return await this.companiesService.updatePriceHistory(id, priceEntry);
  }

  /**
   * POST /companies/:id/equity
   * Creates a new equity for a company
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/equity')
  async createEquity(
    @Param('id') companyId: string,
    @Body() createEquityDto: CreateEquityDto,
  ) {
    // Verify company exists and get company details
    const company = await this.companiesService.findOne(companyId);
    createEquityDto.companyId = companyId;
    
    // Get the company user's Hedera account ID
    try {
      const user = await this.userModel.findOne({ useremail: company.useremail }).exec();
      if (user && user.hederaAccountId) {
        createEquityDto.companyAccountId = user.hederaAccountId;
      }
    } catch (error) {
      console.error('Failed to retrieve company user Hedera account:', error);
      // Continue without company account ID - will use operator account
    }
    
    return await this.equityService.createEquity(createEquityDto);
  }

  /**
   * POST /companies/:id/bond
   * Creates a new bond for a company
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/bond')
  async createBond(
    @Param('id') companyId: string,
    @Body() createBondDto: CreateBondDto,
  ) {
    // Verify company exists and get company details
    const company = await this.companiesService.findOne(companyId);
    createBondDto.companyId = companyId;
    
    // Get the company user's Hedera account ID
    try {
      const user = await this.userModel.findOne({ useremail: company.useremail }).exec();
      if (user && user.hederaAccountId) {
        createBondDto.companyAccountId = user.hederaAccountId;
      }
    } catch (error) {
      console.error('Failed to retrieve company user Hedera account:', error);
      // Continue without company account ID - will use operator account
    }
    
    return await this.bondService.createBond(createBondDto);
  }

  /**
   * GET /companies/:id/equity
   * Retrieves all equity for a company
   */
  @Get(':id/equity')
  async getCompanyEquity(@Param('id') companyId: string) {
    // Verify company exists
    await this.companiesService.findOne(companyId);
    return await this.equityService.findByCompany(companyId);
  }

  /**
   * GET /companies/:id/bond
   * Retrieves all bond for a company
   */
  @Get(':id/bond')
  async getCompanyBond(@Param('id') companyId: string) {
    // Verify company exists
    await this.companiesService.findOne(companyId);
    return await this.bondService.findByCompany(companyId);
  }
}
