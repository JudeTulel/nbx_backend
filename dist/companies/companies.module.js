"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompaniesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const companies_controller_1 = require("./companies.controller");
const companies_service_1 = require("./companies.service");
const company_schema_1 = require("./company.schema");
const equity_schema_1 = require("./equity.schema");
const bond_schema_1 = require("./bond.schema");
const uploads_module_1 = require("../uploads/uploads.module");
const users_module_1 = require("../users/users.module");
let CompaniesModule = class CompaniesModule {
};
exports.CompaniesModule = CompaniesModule;
exports.CompaniesModule = CompaniesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: company_schema_1.Company.name, schema: company_schema_1.CompanySchema },
                { name: equity_schema_1.Equity.name, schema: equity_schema_1.EquitySchema },
                { name: bond_schema_1.Bond.name, schema: bond_schema_1.BondSchema },
            ]),
            uploads_module_1.UploadsModule,
            users_module_1.UsersModule,
        ],
        controllers: [companies_controller_1.CompaniesController],
        providers: [companies_service_1.CompaniesService],
        exports: [companies_service_1.CompaniesService],
    })
], CompaniesModule);
//# sourceMappingURL=companies.module.js.map