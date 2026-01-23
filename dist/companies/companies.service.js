"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CompaniesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_schema_1 = require("./company.schema");
const equity_schema_1 = require("./equity.schema");
const bond_schema_1 = require("./bond.schema");
const uploads_service_1 = require("../uploads/uploads.service");
let CompaniesService = CompaniesService_1 = class CompaniesService {
    companyModel;
    equityModel;
    bondModel;
    uploadsService;
    logger = new common_1.Logger(CompaniesService_1.name);
    constructor(companyModel, equityModel, bondModel, uploadsService) {
        this.companyModel = companyModel;
        this.equityModel = equityModel;
        this.bondModel = bondModel;
        this.uploadsService = uploadsService;
    }
    async create(createCompanyDto) {
        try {
            if (!createCompanyDto.name || !createCompanyDto.ticker || !createCompanyDto.useremail) {
                throw new common_1.BadRequestException('Name, ticker, and useremail are required');
            }
            if (!createCompanyDto.certificateOfIncorporation ||
                !createCompanyDto.cr12 ||
                !createCompanyDto.memArts) {
                throw new common_1.BadRequestException('All required documents must be provided');
            }
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
                documents: [],
                highlights: createCompanyDto.highlights || [],
                team: createCompanyDto.team || [],
                priceHistory: createCompanyDto.priceHistory || [],
            });
            const savedCompany = await newCompany.save();
            const documents = [];
            try {
                const incorpResult = await this.uploadsService.uploadFile(createCompanyDto.certificateOfIncorporation, uploads_service_1.UploadCategory.COMPANY_DOCUMENTS);
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
                const cr12Result = await this.uploadsService.uploadFile(createCompanyDto.cr12, uploads_service_1.UploadCategory.COMPANY_DOCUMENTS);
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
                const memArtsResult = await this.uploadsService.uploadFile(createCompanyDto.memArts, uploads_service_1.UploadCategory.COMPANY_DOCUMENTS);
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
                if (createCompanyDto.otherDocs && Array.isArray(createCompanyDto.otherDocs)) {
                    for (let i = 0; i < createCompanyDto.otherDocs.length; i++) {
                        const file = createCompanyDto.otherDocs[i];
                        const result = await this.uploadsService.uploadFile(file, uploads_service_1.UploadCategory.COMPANY_DOCUMENTS);
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
                savedCompany.documents = documents;
                await savedCompany.save();
                this.logger.log(`Company created successfully: ${savedCompany.name} (ID: ${savedCompany._id})`);
                return savedCompany;
            }
            catch (uploadError) {
                this.logger.error(`Upload failed, cleaning up company: ${uploadError.message}`);
                await this.companyModel.findByIdAndDelete(savedCompany._id).exec();
                for (const doc of documents) {
                    try {
                        await this.uploadsService.deleteFile(doc.path);
                    }
                    catch (cleanupError) {
                        this.logger.warn(`Failed to cleanup file: ${doc.path}`);
                    }
                }
                throw new common_1.InternalServerErrorException('Failed to upload company documents');
            }
        }
        catch (error) {
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                throw new common_1.BadRequestException(`Company with this ${field} already exists`);
            }
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            this.logger.error(`Failed to create company: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to create company');
        }
    }
    async findAll(skip = 0, limit = 10, sector) {
        try {
            const filter = sector ? { sector } : {};
            const companies = await this.companyModel
                .find(filter)
                .skip(skip)
                .limit(limit)
                .exec();
            const total = await this.companyModel.countDocuments(filter).exec();
            return { companies, total };
        }
        catch (error) {
            this.logger.error(`Failed to retrieve companies: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve companies');
        }
    }
    async findOne(id) {
        try {
            const company = await this.companyModel.findById(id).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${id} not found`);
            }
            return company;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to find company: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve company');
        }
    }
    async findBySymbol(symbol) {
        try {
            const company = await this.companyModel.findOne({ symbol }).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with symbol ${symbol} not found`);
            }
            return company;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to find company by symbol: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve company');
        }
    }
    async findByUserEmail(useremail) {
        try {
            const companies = await this.companyModel
                .find({ useremail })
                .sort({ createdAt: -1 })
                .exec();
            return companies;
        }
        catch (error) {
            this.logger.error(`Failed to find companies by user: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve user companies');
        }
    }
    async update(id, updateCompanyDto) {
        try {
            const company = await this.companyModel
                .findByIdAndUpdate(id, updateCompanyDto, { new: true })
                .exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${id} not found`);
            }
            this.logger.log(`Company updated successfully: ${company.name} (ID: ${id})`);
            return company;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            if (error.code === 11000) {
                const field = Object.keys(error.keyPattern)[0];
                throw new common_1.BadRequestException(`Company with this ${field} already exists`);
            }
            this.logger.error(`Failed to update company: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to update company');
        }
    }
    async addDocument(companyId, file, documentType, documentName) {
        try {
            const company = await this.companyModel.findById(companyId).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${companyId} not found`);
            }
            const uploadResult = await this.uploadsService.uploadFile(file, uploads_service_1.UploadCategory.COMPANY_DOCUMENTS);
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to add document: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to add document to company');
        }
    }
    async removeDocument(companyId, documentId) {
        try {
            const company = await this.companyModel.findById(companyId).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${companyId} not found`);
            }
            const documentIndex = company.documents.findIndex((doc) => doc._id.toString() === documentId);
            if (documentIndex === -1) {
                throw new common_1.NotFoundException('Document not found');
            }
            const document = company.documents[documentIndex];
            try {
                await this.uploadsService.deleteFile(document.path);
            }
            catch (deleteError) {
                this.logger.warn(`Failed to delete file from disk: ${document.path}`);
            }
            company.documents.splice(documentIndex, 1);
            await company.save();
            this.logger.log(`Document removed from company ${companyId}: ${document.name}`);
            return company;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to remove document: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to remove document');
        }
    }
    async remove(id) {
        try {
            const company = await this.companyModel.findById(id).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${id} not found`);
            }
            if (company.documents && company.documents.length > 0) {
                for (const doc of company.documents) {
                    try {
                        await this.uploadsService.deleteFile(doc.path);
                    }
                    catch (deleteError) {
                        this.logger.warn(`Failed to delete file: ${doc.path}`);
                    }
                }
            }
            await this.companyModel.findByIdAndDelete(id).exec();
            this.logger.log(`Company deleted successfully: ${company.name} (ID: ${id})`);
            return { message: `Company ${company.name} deleted successfully` };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to delete company: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to delete company');
        }
    }
    async updatePriceHistory(id, priceEntry) {
        try {
            const company = await this.companyModel.findById(id).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${id} not found`);
            }
            company.priceHistory.push(priceEntry);
            await company.save();
            this.logger.log(`Price history updated for company ${id}: ${priceEntry.price} on ${priceEntry.date}`);
            return company;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to update price history: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to update price history');
        }
    }
    async getCompanyStats() {
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
                bySector: bySector.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                recentCompanies,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get company stats: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve company statistics');
        }
    }
    async findAllSecurities(type = 'all', status) {
        try {
            const securities = [];
            const statusParam = status || 'active';
            const statusFilter = { status: { $regex: new RegExp(`^${statusParam}$`, 'i') } };
            if (type === 'all' || type === 'equity') {
                const equities = await this.equityModel
                    .aggregate([
                    { $match: statusFilter },
                    {
                        $lookup: {
                            from: 'companies',
                            localField: 'companyId',
                            foreignField: '_id',
                            as: 'company',
                        },
                    },
                    { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
                    { $sort: { createdAt: -1 } },
                ])
                    .exec();
                for (const equity of equities) {
                    securities.push({
                        id: equity._id,
                        type: 'equity',
                        name: equity.name,
                        symbol: equity.symbol,
                        isin: equity.isin,
                        assetAddress: equity.assetAddress,
                        diamondAddress: equity.diamondAddress,
                        totalSupply: equity.totalSupply,
                        nominalValue: equity.nominalValue,
                        currency: equity.currency,
                        decimals: equity.decimals,
                        dividendYield: equity.dividendYield,
                        votingRights: equity.votingRights,
                        status: equity.status,
                        network: equity.network,
                        tokenizedAt: equity.tokenizedAt,
                        createdAt: equity.createdAt,
                        paymentTokens: equity.paymentTokens || ['0.0.7228867'],
                        treasuryAccountId: equity.treasuryAccountId,
                        company: equity.company ? {
                            id: equity.company._id,
                            name: equity.company.name,
                            ticker: equity.company.ticker,
                            symbol: equity.company.symbol,
                            sector: equity.company.sector,
                            description: equity.company.description,
                            marketCap: equity.company.marketCap,
                            documents: equity.company.documents,
                            team: equity.company.team,
                            highlights: equity.company.highlights,
                            priceHistory: equity.company.priceHistory,
                        } : null,
                    });
                }
            }
            if (type === 'all' || type === 'bond') {
                const bonds = await this.bondModel
                    .aggregate([
                    { $match: statusFilter },
                    {
                        $lookup: {
                            from: 'companies',
                            localField: 'companyId',
                            foreignField: '_id',
                            as: 'company',
                        },
                    },
                    { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
                    { $sort: { createdAt: -1 } },
                ])
                    .exec();
                for (const bond of bonds) {
                    securities.push({
                        id: bond._id,
                        type: 'bond',
                        name: bond.name,
                        symbol: bond.symbol,
                        isin: bond.isin,
                        assetAddress: bond.assetAddress,
                        diamondAddress: bond.diamondAddress,
                        totalSupply: bond.totalSupply,
                        nominalValue: bond.nominalValue,
                        currency: bond.currency,
                        decimals: bond.decimals,
                        couponRate: bond.couponRate,
                        maturityDate: bond.maturityDate,
                        couponFrequency: bond.couponFrequency,
                        status: bond.status,
                        network: bond.network,
                        tokenizedAt: bond.tokenizedAt,
                        createdAt: bond.createdAt,
                        paymentTokens: bond.paymentTokens || ['0.0.7228867'],
                        treasuryAccountId: bond.treasuryAccountId,
                        company: bond.company ? {
                            id: bond.company._id,
                            name: bond.company.name,
                            ticker: bond.company.ticker,
                            symbol: bond.company.symbol,
                            sector: bond.company.sector,
                            description: bond.company.description,
                            marketCap: bond.company.marketCap,
                            documents: bond.company.documents,
                            team: bond.company.team,
                            highlights: bond.company.highlights,
                            priceHistory: bond.company.priceHistory,
                        } : null,
                    });
                }
            }
            securities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return securities;
        }
        catch (error) {
            this.logger.error(`Failed to find all securities: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve securities');
        }
    }
    async createEquity(companyId, createEquityDto) {
        try {
            const company = await this.companyModel.findById(companyId).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${companyId} not found`);
            }
            const equity = new this.equityModel({
                ...createEquityDto,
                companyId: new mongoose_2.Types.ObjectId(companyId),
                tokenizedAt: createEquityDto.tokenizedAt ? new Date(createEquityDto.tokenizedAt) : new Date(),
            });
            const savedEquity = await equity.save();
            await this.companyModel.findByIdAndUpdate(companyId, {
                isTokenized: true,
            });
            this.logger.log(`Equity created for company ${companyId}: ${savedEquity.name} (${savedEquity.assetAddress})`);
            return savedEquity;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to create equity: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to create equity');
        }
    }
    async findEquitiesByCompany(companyId) {
        try {
            const equities = await this.equityModel
                .find({ companyId: new mongoose_2.Types.ObjectId(companyId) })
                .sort({ createdAt: -1 })
                .exec();
            return equities;
        }
        catch (error) {
            this.logger.error(`Failed to find equities: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve equities');
        }
    }
    async findEquityById(equityId) {
        try {
            const equity = await this.equityModel.findById(equityId).exec();
            if (!equity) {
                throw new common_1.NotFoundException(`Equity with ID ${equityId} not found`);
            }
            return equity;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to find equity: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve equity');
        }
    }
    async createBond(companyId, createBondDto) {
        try {
            const company = await this.companyModel.findById(companyId).exec();
            if (!company) {
                throw new common_1.NotFoundException(`Company with ID ${companyId} not found`);
            }
            const bond = new this.bondModel({
                ...createBondDto,
                companyId: new mongoose_2.Types.ObjectId(companyId),
                tokenizedAt: createBondDto.tokenizedAt ? new Date(createBondDto.tokenizedAt) : new Date(),
            });
            const savedBond = await bond.save();
            await this.companyModel.findByIdAndUpdate(companyId, {
                isTokenized: true,
            });
            this.logger.log(`Bond created for company ${companyId}: ${savedBond.name} (${savedBond.assetAddress})`);
            return savedBond;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to create bond: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to create bond');
        }
    }
    async findBondsByCompany(companyId) {
        try {
            const bonds = await this.bondModel
                .find({ companyId: new mongoose_2.Types.ObjectId(companyId) })
                .sort({ createdAt: -1 })
                .exec();
            return bonds;
        }
        catch (error) {
            this.logger.error(`Failed to find bonds: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve bonds');
        }
    }
    async findBondById(bondId) {
        try {
            const bond = await this.bondModel.findById(bondId).exec();
            if (!bond) {
                throw new common_1.NotFoundException(`Bond with ID ${bondId} not found`);
            }
            return bond;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.error(`Failed to find bond: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve bond');
        }
    }
};
exports.CompaniesService = CompaniesService;
exports.CompaniesService = CompaniesService = CompaniesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(company_schema_1.Company.name)),
    __param(1, (0, mongoose_1.InjectModel)(equity_schema_1.Equity.name)),
    __param(2, (0, mongoose_1.InjectModel)(bond_schema_1.Bond.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        uploads_service_1.UploadsService])
], CompaniesService);
//# sourceMappingURL=companies.service.js.map