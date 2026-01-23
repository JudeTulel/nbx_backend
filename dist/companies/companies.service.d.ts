import { Model } from 'mongoose';
import { Company } from './company.schema';
import { Equity } from './equity.schema';
import { Bond } from './bond.schema';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CreateEquityDto } from './dto/create-equity.dto';
import { CreateBondDto } from './dto/create-bond.dto';
import { UploadsService } from '../uploads/uploads.service';
export declare class CompaniesService {
    private readonly companyModel;
    private readonly equityModel;
    private readonly bondModel;
    private readonly uploadsService;
    private readonly logger;
    constructor(companyModel: Model<Company>, equityModel: Model<Equity>, bondModel: Model<Bond>, uploadsService: UploadsService);
    create(createCompanyDto: CreateCompanyDto): Promise<Company>;
    findAll(skip?: number, limit?: number, sector?: string): Promise<{
        companies: Company[];
        total: number;
    }>;
    findOne(id: string): Promise<Company>;
    findBySymbol(symbol: string): Promise<Company>;
    findByUserEmail(useremail: string): Promise<Company[]>;
    update(id: string, updateCompanyDto: UpdateCompanyDto): Promise<Company>;
    addDocument(companyId: string, file: Express.Multer.File, documentType: string, documentName?: string): Promise<Company>;
    removeDocument(companyId: string, documentId: string): Promise<Company>;
    remove(id: string): Promise<{
        message: string;
    }>;
    updatePriceHistory(id: string, priceEntry: {
        date: string;
        price: number;
    }): Promise<Company>;
    getCompanyStats(): Promise<any>;
    findAllSecurities(type?: 'equity' | 'bond' | 'all', status?: string): Promise<any[]>;
    createEquity(companyId: string, createEquityDto: CreateEquityDto): Promise<Equity>;
    findEquitiesByCompany(companyId: string): Promise<Equity[]>;
    findEquityById(equityId: string): Promise<Equity>;
    createBond(companyId: string, createBondDto: CreateBondDto): Promise<Bond>;
    findBondsByCompany(companyId: string): Promise<Bond[]>;
    findBondById(bondId: string): Promise<Bond>;
}
