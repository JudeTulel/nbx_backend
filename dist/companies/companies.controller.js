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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const companies_service_1 = require("./companies.service");
const create_company_dto_1 = require("./dto/create-company.dto");
const update_company_dto_1 = require("./dto/update-company.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let CompaniesController = class CompaniesController {
    companiesService;
    constructor(companiesService) {
        this.companiesService = companiesService;
    }
    async create(body, files) {
        if (!files.certificateOfIncorporation || !files.cr12 || !files.memArts) {
            throw new common_1.BadRequestException('All required documents must be uploaded (Certificate of Incorporation, CR12, Memorandum & Articles)');
        }
        const createCompanyDto = {
            ...body,
            certificateOfIncorporation: files.certificateOfIncorporation[0],
            cr12: files.cr12[0],
            memArts: files.memArts[0],
            otherDocs: files.otherDocs || [],
        };
        const company = await this.companiesService.create(createCompanyDto);
        return {
            success: true,
            message: 'Company created successfully',
            data: company,
        };
    }
    async findAll(skip, limit, sector) {
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
    async getStats() {
        const stats = await this.companiesService.getCompanyStats();
        return {
            success: true,
            data: stats,
        };
    }
    async findAllSecurities(type, status) {
        const securities = await this.companiesService.findAllSecurities(type || 'all', status);
        return {
            success: true,
            count: securities.length,
            data: securities,
        };
    }
    async findByUser(email) {
        const companies = await this.companiesService.findByUserEmail(email);
        return {
            success: true,
            count: companies.length,
            data: companies,
        };
    }
    async findBySymbol(symbol) {
        const company = await this.companiesService.findBySymbol(symbol);
        return {
            success: true,
            data: company,
        };
    }
    async findOne(id) {
        const company = await this.companiesService.findOne(id);
        return {
            success: true,
            data: company,
        };
    }
    async update(id, updateCompanyDto) {
        const company = await this.companiesService.update(id, updateCompanyDto);
        return {
            success: true,
            message: 'Company updated successfully',
            data: company,
        };
    }
    async remove(id) {
        const result = await this.companiesService.remove(id);
        return {
            success: true,
            ...result,
        };
    }
    async updatePriceHistory(id, priceEntry) {
        const company = await this.companiesService.updatePriceHistory(id, priceEntry);
        return {
            success: true,
            message: 'Price history updated successfully',
            data: company,
        };
    }
    async addDocument(id, documentType, documentName, files) {
        if (!files.file || !files.file[0]) {
            throw new common_1.BadRequestException('File is required');
        }
        const company = await this.companiesService.addDocument(id, files.file[0], documentType, documentName);
        return {
            success: true,
            message: 'Document added successfully',
            data: company,
        };
    }
    async removeDocument(id, documentId) {
        const company = await this.companiesService.removeDocument(id, documentId);
        return {
            success: true,
            message: 'Document removed successfully',
            data: company,
        };
    }
    async createEquity(id, createEquityDto) {
        const equity = await this.companiesService.createEquity(id, createEquityDto);
        return {
            success: true,
            message: 'Equity created successfully',
            data: equity,
        };
    }
    async findEquities(id) {
        const equities = await this.companiesService.findEquitiesByCompany(id);
        return {
            success: true,
            count: equities.length,
            data: equities,
        };
    }
    async findEquity(id, equityId) {
        const equity = await this.companiesService.findEquityById(equityId);
        return {
            success: true,
            data: equity,
        };
    }
    async createBond(id, createBondDto) {
        const bond = await this.companiesService.createBond(id, createBondDto);
        return {
            success: true,
            message: 'Bond created successfully',
            data: bond,
        };
    }
    async findBonds(id) {
        const bonds = await this.companiesService.findBondsByCompany(id);
        return {
            success: true,
            count: bonds.length,
            data: bonds,
        };
    }
    async findBond(id, bondId) {
        const bond = await this.companiesService.findBondById(bondId);
        return {
            success: true,
            data: bond,
        };
    }
};
exports.CompaniesController = CompaniesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([
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
            }
            else {
                cb(new common_1.BadRequestException(`Invalid file type: ${fileExtension}. Allowed types: ${allowedExtensions.join(', ')}`), false);
            }
        },
        limits: {
            fileSize: 10 * 1024 * 1024,
        },
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_company_dto_1.CreateCompanyDto, Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('skip')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('sector')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('securities/all'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findAllSecurities", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('user/:email'),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findByUser", null);
__decorate([
    (0, common_1.Get)('symbol/:symbol'),
    __param(0, (0, common_1.Param)('symbol')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findBySymbol", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findOne", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_company_dto_1.UpdateCompanyDto]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/price-history'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "updatePriceHistory", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/documents'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileFieldsInterceptor)([{ name: 'file', maxCount: 1 }])),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('documentType')),
    __param(2, (0, common_1.Body)('documentName')),
    __param(3, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "addDocument", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Delete)(':id/documents/:documentId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "removeDocument", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/equity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "createEquity", null);
__decorate([
    (0, common_1.Get)(':id/equity'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findEquities", null);
__decorate([
    (0, common_1.Get)(':id/equity/:equityId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('equityId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findEquity", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/bond'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "createBond", null);
__decorate([
    (0, common_1.Get)(':id/bond'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findBonds", null);
__decorate([
    (0, common_1.Get)(':id/bond/:bondId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('bondId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CompaniesController.prototype, "findBond", null);
exports.CompaniesController = CompaniesController = __decorate([
    (0, common_1.Controller)('companies'),
    __metadata("design:paramtypes", [companies_service_1.CompaniesService])
], CompaniesController);
//# sourceMappingURL=companies.controller.js.map