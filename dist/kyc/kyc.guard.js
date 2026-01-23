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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCGuard = void 0;
const common_1 = require("@nestjs/common");
const kyc_service_1 = require("./kyc.service");
let KYCGuard = class KYCGuard {
    kycService;
    constructor(kycService) {
        this.kycService = kycService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user._id) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const isApproved = await this.kycService.isKYCApproved(user._id);
        if (!isApproved) {
            throw new common_1.ForbiddenException('KYC verification required to access this resource');
        }
        return true;
    }
};
exports.KYCGuard = KYCGuard;
exports.KYCGuard = KYCGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [kyc_service_1.KYCService])
], KYCGuard);
//# sourceMappingURL=kyc.guard.js.map