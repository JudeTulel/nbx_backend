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
var KYCService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const kyc_schema_1 = require("./kyc.schema");
const users_schema_1 = require("../users/users.schema");
let KYCService = KYCService_1 = class KYCService {
    kycModel;
    userModel;
    logger = new common_1.Logger(KYCService_1.name);
    constructor(kycModel, userModel) {
        this.kycModel = kycModel;
        this.userModel = userModel;
    }
    async submitKYC(dto, frontImageUrl, backImageUrl) {
        try {
            const user = await this.userModel.findById(dto.userId).exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            if (user.useremail !== dto.useremail) {
                throw new common_1.BadRequestException('Email does not match user account');
            }
            const existing = await this.kycModel.findOne({
                userId: new mongoose_2.Types.ObjectId(dto.userId)
            }).exec();
            if (existing) {
                if (existing.status === kyc_schema_1.KYCStatus.APPROVED) {
                    throw new common_1.ConflictException('KYC already approved for this user');
                }
                if (existing.status === kyc_schema_1.KYCStatus.PENDING ||
                    existing.status === kyc_schema_1.KYCStatus.UNDER_REVIEW) {
                    throw new common_1.ConflictException('KYC submission already in progress');
                }
                existing.fullName = dto.fullName;
                existing.idNumber = dto.idNumber;
                existing.documentType = dto.documentType || existing.documentType;
                existing.frontImageUrl = frontImageUrl;
                existing.backImageUrl = backImageUrl;
                existing.status = kyc_schema_1.KYCStatus.PENDING;
                existing.rejectionReason = undefined;
                existing.reviewedBy = undefined;
                existing.reviewedAt = undefined;
                existing.submittedAt = new Date();
                const updatedKyc = await existing.save();
                await this.updateUserKYCStatus(dto.userId, kyc_schema_1.KYCStatus.PENDING);
                return updatedKyc;
            }
            const kyc = new this.kycModel({
                userId: new mongoose_2.Types.ObjectId(dto.userId),
                useremail: dto.useremail,
                fullName: dto.fullName,
                idNumber: dto.idNumber,
                documentType: dto.documentType,
                frontImageUrl,
                backImageUrl,
                status: kyc_schema_1.KYCStatus.PENDING,
                submittedAt: new Date(),
            });
            const savedKyc = await kyc.save();
            await this.updateUserKYCStatus(dto.userId, kyc_schema_1.KYCStatus.PENDING);
            return savedKyc;
        }
        catch (error) {
            this.logger.error(`Failed to submit KYC: ${error.message}`);
            if (error instanceof common_1.ConflictException ||
                error instanceof common_1.BadRequestException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to submit KYC application');
        }
    }
    async getKYCByUserId(userId) {
        try {
            const kyc = await this.kycModel
                .findOne({ userId: new mongoose_2.Types.ObjectId(userId) })
                .populate('userId', 'useremail role hederaAccountId')
                .exec();
            if (!kyc) {
                throw new common_1.NotFoundException('No KYC submission found for this user');
            }
            return kyc;
        }
        catch (error) {
            this.logger.error(`Failed to get KYC: ${error.message}`);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve KYC data');
        }
    }
    async getKYCByEmail(useremail) {
        try {
            const kyc = await this.kycModel
                .findOne({ useremail })
                .populate('userId', 'useremail role hederaAccountId')
                .exec();
            if (!kyc) {
                throw new common_1.NotFoundException('No KYC submission found for this user');
            }
            return kyc;
        }
        catch (error) {
            this.logger.error(`Failed to get KYC: ${error.message}`);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve KYC data');
        }
    }
    async getAllKYC(query) {
        try {
            const filter = {};
            if (query.status) {
                filter.status = query.status;
            }
            if (query.useremail) {
                filter.useremail = { $regex: query.useremail, $options: 'i' };
            }
            if (query.userId) {
                filter.userId = new mongoose_2.Types.ObjectId(query.userId);
            }
            return await this.kycModel
                .find(filter)
                .populate('userId', 'useremail role hederaAccountId')
                .sort({ createdAt: -1 })
                .exec();
        }
        catch (error) {
            this.logger.error(`Failed to get all KYC: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve KYC submissions');
        }
    }
    async reviewKYC(id, dto) {
        try {
            const kyc = await this.kycModel.findById(id).exec();
            if (!kyc) {
                throw new common_1.NotFoundException('KYC submission not found');
            }
            if (kyc.status === kyc_schema_1.KYCStatus.APPROVED && dto.status !== kyc_schema_1.KYCStatus.EXPIRED) {
                throw new common_1.BadRequestException('Cannot change status of approved KYC');
            }
            kyc.status = dto.status;
            kyc.reviewedBy = dto.reviewedBy;
            kyc.reviewedAt = new Date();
            if (dto.status === kyc_schema_1.KYCStatus.REJECTED) {
                if (!dto.rejectionReason) {
                    throw new common_1.BadRequestException('Rejection reason is required');
                }
                kyc.rejectionReason = dto.rejectionReason;
            }
            else {
                kyc.rejectionReason = undefined;
            }
            if (dto.status === kyc_schema_1.KYCStatus.APPROVED) {
                const expiryDate = new Date();
                expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                kyc.expiresAt = expiryDate;
            }
            const updatedKyc = await kyc.save();
            await this.updateUserKYCStatus(kyc.userId.toString(), dto.status);
            return updatedKyc;
        }
        catch (error) {
            this.logger.error(`Failed to review KYC: ${error.message}`);
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to review KYC');
        }
    }
    async deleteKYC(id) {
        try {
            const kyc = await this.kycModel.findByIdAndDelete(id).exec();
            if (!kyc) {
                throw new common_1.NotFoundException('KYC submission not found');
            }
            await this.userModel.findByIdAndUpdate(kyc.userId, {
                kycVerified: false,
                kycStatus: null,
                kycSubmittedAt: null,
                kycApprovedAt: null,
            }).exec();
        }
        catch (error) {
            this.logger.error(`Failed to delete KYC: ${error.message}`);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to delete KYC');
        }
    }
    async isKYCApproved(userId) {
        try {
            const kyc = await this.kycModel.findOne({
                userId: new mongoose_2.Types.ObjectId(userId),
                status: kyc_schema_1.KYCStatus.APPROVED,
            }).exec();
            if (kyc && kyc.expiresAt && kyc.expiresAt < new Date()) {
                kyc.status = kyc_schema_1.KYCStatus.EXPIRED;
                await kyc.save();
                await this.updateUserKYCStatus(userId, kyc_schema_1.KYCStatus.EXPIRED);
                return false;
            }
            return !!kyc;
        }
        catch (error) {
            this.logger.error(`Failed to check KYC approval: ${error.message}`);
            return false;
        }
    }
    async updateUserKYCStatus(userId, status) {
        const updateData = {
            kycStatus: status,
        };
        if (status === kyc_schema_1.KYCStatus.PENDING) {
            updateData.kycSubmittedAt = new Date();
            updateData.kycVerified = false;
        }
        else if (status === kyc_schema_1.KYCStatus.APPROVED) {
            updateData.kycVerified = true;
            updateData.kycApprovedAt = new Date();
        }
        else if (status === kyc_schema_1.KYCStatus.REJECTED || status === kyc_schema_1.KYCStatus.EXPIRED) {
            updateData.kycVerified = false;
            updateData.kycApprovedAt = null;
        }
        await this.userModel.findByIdAndUpdate(userId, updateData).exec();
    }
    async getKYCStats() {
        try {
            const [total, pending, underReview, approved, rejected, expired] = await Promise.all([
                this.kycModel.countDocuments().exec(),
                this.kycModel.countDocuments({ status: kyc_schema_1.KYCStatus.PENDING }).exec(),
                this.kycModel.countDocuments({ status: kyc_schema_1.KYCStatus.UNDER_REVIEW }).exec(),
                this.kycModel.countDocuments({ status: kyc_schema_1.KYCStatus.APPROVED }).exec(),
                this.kycModel.countDocuments({ status: kyc_schema_1.KYCStatus.REJECTED }).exec(),
                this.kycModel.countDocuments({ status: kyc_schema_1.KYCStatus.EXPIRED }).exec(),
            ]);
            return {
                total,
                pending,
                underReview,
                approved,
                rejected,
                expired,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get KYC stats: ${error.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve KYC statistics');
        }
    }
};
exports.KYCService = KYCService;
exports.KYCService = KYCService = KYCService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(kyc_schema_1.KYC.name)),
    __param(1, (0, mongoose_1.InjectModel)(users_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], KYCService);
//# sourceMappingURL=kyc.service.js.map