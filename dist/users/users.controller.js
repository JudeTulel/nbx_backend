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
exports.UserController = exports.UpdateRoleDto = exports.UpdatePasswordDto = exports.LoginDto = exports.CreateUserDto = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
class CreateUserDto {
    useremail;
    password;
    hederaAccountId;
    role;
}
exports.CreateUserDto = CreateUserDto;
class LoginDto {
    useremail;
    password;
}
exports.LoginDto = LoginDto;
class UpdatePasswordDto {
    currentPassword;
    newPassword;
}
exports.UpdatePasswordDto = UpdatePasswordDto;
class UpdateRoleDto {
    newRole;
}
exports.UpdateRoleDto = UpdateRoleDto;
let UserController = class UserController {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async register(createUserDto) {
        const { useremail, password, hederaAccountId, role = 'investor' } = createUserDto;
        const user = await this.userService.createUser(useremail, password, hederaAccountId, role);
        return {
            message: 'User registered successfully',
            user: {
                id: user._id,
                useremail: user.useremail,
                role: user.role,
                hederaAccountId: user.hederaAccountId,
                createdAt: user.createdAt,
            },
        };
    }
    async login(loginDto) {
        const { useremail, password } = loginDto;
        const user = await this.userService.login(useremail, password);
        return {
            message: 'Login successful',
            user: {
                id: user._id,
                useremail: user.useremail,
                role: user.role,
                hederaAccountId: user.hederaAccountId,
                lastLogin: user.lastLogin,
            },
        };
    }
    async getProfile(useremail) {
        const user = await this.userService.getUserProfile(useremail);
        return {
            user,
        };
    }
    async getByHederaAccount(accountId) {
        const user = await this.userService.findByHederaAccount(accountId);
        return {
            user: {
                id: user._id,
                useremail: user.useremail,
                role: user.role,
                hederaAccountId: user.hederaAccountId,
            },
        };
    }
    async updatePassword(useremail, updatePasswordDto) {
        const { currentPassword, newPassword } = updatePasswordDto;
        await this.userService.updatePassword(useremail, currentPassword, newPassword);
        return {
            message: 'Password updated successfully',
        };
    }
    async updateRole(useremail, updateRoleDto) {
        const { newRole } = updateRoleDto;
        const user = await this.userService.updateUserRole(useremail, newRole);
        return {
            message: 'Role updated successfully',
            user: {
                id: user._id,
                useremail: user.useremail,
                role: user.role,
            },
        };
    }
    async deleteUser(useremail) {
        await this.userService.deleteUser(useremail);
        return {
            message: 'User deleted successfully',
        };
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [LoginDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('profile/:useremail'),
    __param(0, (0, common_1.Param)('useremail')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)('hedera/:accountId'),
    __param(0, (0, common_1.Param)('accountId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getByHederaAccount", null);
__decorate([
    (0, common_1.Put)('password/:useremail'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('useremail')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePasswordDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.Put)('role/:useremail'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('useremail')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateRole", null);
__decorate([
    (0, common_1.Delete)(':useremail'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('admin'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('useremail')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteUser", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UserService])
], UserController);
//# sourceMappingURL=users.controller.js.map