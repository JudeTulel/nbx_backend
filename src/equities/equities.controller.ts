import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EquitiesService } from './equities.service';
import {
  CreateEquityDto,
  SetDividendDto,
  SetVotingRightsDto,
} from './dto/create-equity.dto';

@Controller('equities')
export class EquitiesController {
  constructor(private readonly equitiesService: EquitiesService) {}

  /**
   * POST /equities
   * Creates a new equity
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createEquityDto: CreateEquityDto) {
    return await this.equitiesService.create(createEquityDto);
  }

  /**
   * POST /equities/:id/dividends
   * Sets dividends for an equity
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/dividends')
  async setDividends(
    @Param('id') id: string,
    @Body() setDividendDto: SetDividendDto,
  ) {
    setDividendDto.securityId = id;
    return await this.equitiesService.setDividends(setDividendDto);
  }

  /**
   * POST /equities/:id/voting-rights
   * Sets voting rights for an equity
   */
  @UseGuards(JwtAuthGuard)
  @Post(':id/voting-rights')
  async setVotingRights(
    @Param('id') id: string,
    @Body() setVotingRightsDto: SetVotingRightsDto,
  ) {
    setVotingRightsDto.securityId = id;
    return await this.equitiesService.setVotingRights(setVotingRightsDto);
  }

  /**
   * GET /equities
   * Retrieves all equities
   */
  @Get()
  async findAll() {
    return await this.equitiesService.findAll();
  }

  /**
   * GET /equities/:id
   * Retrieves a single equity by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.equitiesService.findOne(id);
  }

  /**
   * GET /equities/company/:companyId
   * Retrieves equities by company ID
   */
  @Get('company/:companyId')
  async findByCompany(@Param('companyId') companyId: string) {
    return await this.equitiesService.findByCompany(companyId);
  }
}
