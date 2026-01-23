import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
export declare class CompaniesController {
    private readonly companiesService;
    constructor(companiesService: CompaniesService);
    create(body: CreateCompanyDto, files: {
        certificateOfIncorporation?: Express.Multer.File[];
        cr12?: Express.Multer.File[];
        memArts?: Express.Multer.File[];
        otherDocs?: Express.Multer.File[];
    }): Promise<{
        success: boolean;
        message: string;
        data: import("./company.schema").Company;
    }>;
    findAll(skip?: string, limit?: string, sector?: string): Promise<{
        success: boolean;
        count: number;
        total: number;
        data: import("./company.schema").Company[];
    }>;
    getStats(): Promise<{
        success: boolean;
        data: any;
    }>;
    findAllSecurities(type?: 'equity' | 'bond' | 'all', status?: string): Promise<{
        success: boolean;
        count: number;
        data: any[];
    }>;
    findByUser(email: string): Promise<{
        success: boolean;
        count: number;
        data: import("./company.schema").Company[];
    }>;
    findBySymbol(symbol: string): Promise<{
        success: boolean;
        data: import("./company.schema").Company;
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: import("./company.schema").Company;
    }>;
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<{
        success: boolean;
        message: string;
        data: import("./company.schema").Company;
    }>;
    remove(id: string): Promise<{
        message: string;
        success: boolean;
    }>;
    updatePriceHistory(id: string, priceEntry: {
        date: string;
        price: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: import("./company.schema").Company;
    }>;
    addDocument(id: string, documentType: string, documentName: string, files: {
        file?: Express.Multer.File[];
    }): Promise<{
        success: boolean;
        message: string;
        data: import("./company.schema").Company;
    }>;
    removeDocument(id: string, documentId: string): Promise<{
        success: boolean;
        message: string;
        data: import("./company.schema").Company;
    }>;
    createEquity(id: string, createEquityDto: any): Promise<{
        success: boolean;
        message: string;
        data: import("./equity.schema").Equity;
    }>;
    findEquities(id: string): Promise<{
        success: boolean;
        count: number;
        data: import("./equity.schema").Equity[];
    }>;
    findEquity(id: string, equityId: string): Promise<{
        success: boolean;
        data: import("./equity.schema").Equity;
    }>;
    createBond(id: string, createBondDto: any): Promise<{
        success: boolean;
        message: string;
        data: import("./bond.schema").Bond;
    }>;
    findBonds(id: string): Promise<{
        success: boolean;
        count: number;
        data: import("./bond.schema").Bond[];
    }>;
    findBond(id: string, bondId: string): Promise<{
        success: boolean;
        data: import("./bond.schema").Bond;
    }>;
}
