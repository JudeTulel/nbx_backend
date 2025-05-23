import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { Client } from '@hashgraph/sdk';

@Injectable()
export class CompanyService {
  constructor(@InjectModel(Company.name) private companyModel: Model<Company>) {}

  async createCompany(
    companyName: string,
    registrationNumber: string,
    companyEmail: string,
    initialTokenSupply: number,
    stableCoinAddress: string,
    treasuryAddress: string,
  ) {
    // Check if company already exists
    const existingCompany = await this.companyModel.findOne({
      $or: [
        { companyName },
        { RegistrationNumber: registrationNumber },
        { companyEmail },
      ],
    });

    if (existingCompany) {
      throw new Error('Company with this name, registration number, or email already exists');
    }

    // Create new company
    const newCompany = new this.companyModel({
      companyName,
      RegistrationNumber: registrationNumber,
      companyEmail,
      initialTokenSupply,
      stableCoinAddress,
      tresuaryAddress: treasuryAddress,
      listingStatus: false, // Initially not listed
    });

    return await newCompany.save();
  }

  async getAllCompanies() {
    return await this.companyModel.find().exec();
  }

  async getCompanyByName(companyName: string) {
    return await this.companyModel.findOne({ companyName }).exec();
  }

  async getCompanyById(id: string) {
    return await this.companyModel.findById(id).exec();
  }

  async updateListingStatus(companyName: string, listingStatus: boolean) {
    const company = await this.companyModel.findOne({ companyName });
    if (!company) {
      throw new Error('Company not found');
    }

    company.listingStatus = listingStatus;
    return await company.save();
  }

  async updateCompanyDetails(
    companyName: string,
    updates: Partial<{
      companyEmail: string;
      stableCoinAddress: string;
      tresuaryAddress: string;
    }>,
  ) {
    const company = await this.companyModel.findOne({ companyName });
    if (!company) {
      throw new Error('Company not found');
    }

    if (updates.companyEmail) company.companyEmail = updates.companyEmail;
    if (updates.stableCoinAddress) company.stableCoinAddress = updates.stableCoinAddress;
    if (updates.tresuaryAddress) company.tresuaryAddress = updates.tresuaryAddress;

    return await company.save();
  }

  async getListedCompanies() {
    return await this.companyModel.find({ listingStatus: true }).exec();
  }

  async deleteCompany(companyName: string) {
    const result = await this.companyModel.deleteOne({ companyName });
    if (result.deletedCount === 0) {
      throw new Error('Company not found');
    }
    return { success: true, message: 'Company deleted successfully' };
  }
}
