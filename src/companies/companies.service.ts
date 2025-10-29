import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from './company.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
  ) {}

  /**
   * Creates a new company
   */
  async create(createCompanyDto: CreateCompanyDto): Promise<Company> {
    try {
      if (!createCompanyDto.name || !createCompanyDto.symbol) {
        throw new BadRequestException('Name and symbol are required');
      }

      const newCompany = new this.companyModel(createCompanyDto);
      return await newCompany.save();
    } catch (error: any) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new BadRequestException(
          `Company with this ${field} already exists`,
        );
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
   * Deletes a company by ID
   */
  async remove(id: string): Promise<{ message: string }> {
    try {
      const company = await this.companyModel.findByIdAndDelete(id).exec();
      if (!company) {
        throw new NotFoundException(`Company with ID ${id} not found`);
      }
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
      return await company.save();
    } catch (error: any) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error(`Failed to update price history: ${error.message}`);
      throw new InternalServerErrorException('Failed to update price history');
    }
  }
}
