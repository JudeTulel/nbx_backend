import { Controller, Get, Post, Patch, Delete, Param, Query, Body } from "@nestjs/common"
import { CompaniesService } from "./companies.service"
import { CreateCompanyDto } from "./dto/create-company.dto"
import { UpdateCompanyDto } from "./dto/update-company.dto"

@Controller("companies")
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  /**
   * POST /companies
   * Creates a new company
   */
  @Post()
  async create(@Body() createCompanyDto: CreateCompanyDto) {
    return await this.companiesService.create(createCompanyDto)
  }

  /**
   * GET /companies
   * Retrieves all companies with optional filtering and pagination
   */
  @Get()
  async findAll(@Query("skip") skip?: string, @Query("limit") limit?: string, @Query("sector") sector?: string) {
    const skipNum = skip ? Number.parseInt(skip) : 0
    const limitNum = limit ? Number.parseInt(limit) : 10
    return await this.companiesService.findAll(skipNum, limitNum, sector)
  }

  /**
   * GET /companies/symbol/:symbol
   * Retrieves a company by symbol
   */
  @Get("symbol/:symbol")
  async findBySymbol(@Param("symbol") symbol: string) {
    return await this.companiesService.findBySymbol(symbol)
  }

  /**
   * GET /companies/:id
   * Retrieves a single company by ID
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    return await this.companiesService.findOne(id)
  }

  /**
   * PATCH /companies/:id
   * Updates a company by ID
   */
  @Patch(":id")
  async update(@Param("id") id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return await this.companiesService.update(id, updateCompanyDto)
  }

  /**
   * DELETE /companies/:id
   * Deletes a company by ID
   */
  @Delete(":id")
  async remove(@Param("id") id: string) {
    return await this.companiesService.remove(id)
  }

  /**
   * PATCH /companies/:id/price-history
   * Updates price history for a company
   */
  @Patch(":id/price-history")
  async updatePriceHistory(@Param("id") id: string, @Body() priceEntry: { date: string; price: number }) {
    return await this.companiesService.updatePriceHistory(id, priceEntry)
  }
}
