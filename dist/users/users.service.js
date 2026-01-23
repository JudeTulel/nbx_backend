"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const users_schema_1 = require("./users.schema");
const bcrypt = __importStar(require("bcryptjs"));
let UserService = UserService_1 = class UserService {
    userModel;
    logger = new common_1.Logger(UserService_1.name);
    constructor(userModel) {
        this.userModel = userModel;
    }
    async createUser(useremail, password, hederaAccountId, role = 'investor', isKYC = false) {
        try {
            if (!useremail || !password || !hederaAccountId) {
                throw new common_1.BadRequestException('Email, password, and Hedera account ID are required.');
            }
            const accountIdPattern = /^\d+\.\d+\.\d+$/;
            if (!accountIdPattern.test(hederaAccountId)) {
                throw new common_1.BadRequestException('Invalid Hedera account ID format.');
            }
            const existingUser = await this.userModel.findOne({ useremail }).exec();
            if (existingUser) {
                throw new common_1.BadRequestException('User with this email already exists.');
            }
            const existingAccount = await this.userModel.findOne({ hederaAccountId }).exec();
            if (existingAccount) {
                throw new common_1.BadRequestException('This Hedera account is already registered.');
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const newUser = new this.userModel({
                useremail,
                passwordHash,
                role,
                hederaAccountId,
            });
            return await newUser.save();
        }
        catch (error) {
            this.logger.error(`Failed to create user: ${error.message}`);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to create user account.');
        }
    }
    async findOne(useremail) {
        try {
            const user = await this.userModel.findOne({ useremail }).select('+passwordHash').exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        catch (error) {
            this.logger.error(`Failed to find user ${useremail}: ${error.message}`);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve user');
        }
    }
    async findByHederaAccount(hederaAccountId) {
        try {
            const user = await this.userModel.findOne({ hederaAccountId }).exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        catch (error) {
            this.logger.error(`Failed to find user by Hedera account: ${error.message}`);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve user');
        }
    }
    async updatePassword(useremail, currentPassword, newPassword) {
        try {
            const user = await this.userModel.findOne({ useremail }).select('+passwordHash').exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
            if (!isCurrentValid) {
                throw new common_1.UnauthorizedException('Invalid current password');
            }
            if (newPassword.length < 6) {
                throw new common_1.BadRequestException('Password must be at least 6 characters');
            }
            const newPasswordHash = await bcrypt.hash(newPassword, 10);
            user.passwordHash = newPasswordHash;
            return await user.save();
        }
        catch (error) {
            this.logger.error(`Failed to update password for user ${useremail}: ${error.message}`);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to update password');
        }
    }
    async updateUserRole(useremail, newRole) {
        try {
            const user = await this.userModel.findOne({ useremail }).exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            const validRoles = ['investor', 'company', 'auditor', 'admin'];
            if (!validRoles.includes(newRole)) {
                throw new common_1.BadRequestException('Invalid role');
            }
            user.role = newRole;
            return await user.save();
        }
        catch (error) {
            this.logger.error(`Failed to update role for user ${useremail}: ${error.message}`);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to update user role');
        }
    }
    async login(useremail, password) {
        try {
            const user = await this.userModel.findOne({ useremail }).select('+passwordHash').exec();
            if (!user) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            const isValidPassword = await bcrypt.compare(password, user.passwordHash);
            if (!isValidPassword) {
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            return user;
        }
        catch (error) {
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            this.logger.error(`Login failed for user ${useremail}: ${error.message}`);
            throw new common_1.InternalServerErrorException('Login failed');
        }
    }
    async getUserProfile(useremail) {
        try {
            const user = await this.userModel
                .findOne({ useremail })
                .select('-passwordHash -__v')
                .exec();
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            return user;
        }
        catch (error) {
            this.logger.error(`Failed to get profile for user ${useremail}: ${error.message}`);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve user profile');
        }
    }
    async deleteUser(useremail) {
        try {
            const result = await this.userModel.deleteOne({ useremail }).exec();
            if (result.deletedCount === 0) {
                throw new common_1.NotFoundException('User not found');
            }
        }
        catch (error) {
            this.logger.error(`Failed to delete user ${useremail}: ${error.message}`);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to delete user');
        }
    }
};
exports.UserService = UserService;
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(users_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UserService);
//# sourceMappingURL=users.service.js.map