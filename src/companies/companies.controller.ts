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
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { EquityService } from '../equity/equity.service';
import { BondService } from '../bond/bond.service';
import { CreateEquityDto } from '../equity/dto/create-equity.dto';
import { CreateBondDto } from '../bond/dto/create-bond.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly equityService: EquityService,
    private readonly bondService: BondService,
  ) {}

  /**
   * POST /companies
   * Creates a new company
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createCompanyDto: CreateCompanyDto) {
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
    // Verify company exists
    await this.companiesService.findOne(companyId);
    createEquityDto.companyId = companyId;
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
    // Verify company exists
    await this.companiesService.findOne(companyId);
    createBondDto.companyId = companyId;
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
