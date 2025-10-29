import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { BondsService } from './bonds.service';
import { CreateBondDto, SetCouponDto } from './dto/create-bond.dto';

@Controller('bonds')
export class BondsController {
  constructor(private readonly bondsService: BondsService) {}

  /**
   * POST /bonds
   * Creates a new bond
   */
  @Post()
  async create(@Body() createBondDto: CreateBondDto) {
    return await this.bondsService.create(createBondDto);
  }

  /**
   * POST /bonds/:id/coupons
   * Sets coupon for a bond
   */
  @Post(':id/coupons')
  async setCoupon(@Param('id') id: string, @Body() setCouponDto: SetCouponDto) {
    setCouponDto.securityId = id;
    return await this.bondsService.setCoupon(setCouponDto);
  }

  /**
   * GET /bonds
   * Retrieves all bonds
   */
  @Get()
  async findAll() {
    return await this.bondsService.findAll();
  }

  /**
   * GET /bonds/:id
   * Retrieves a single bond by ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.bondsService.findOne(id);
  }

  /**
   * GET /bonds/company/:companyId
   * Retrieves bonds by company ID
   */
  @Get('company/:companyId')
  async findByCompany(@Param('companyId') companyId: string) {
    return await this.bondsService.findByCompany(companyId);
  }
}
