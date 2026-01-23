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
exports.OnrampController = void 0;
const common_1 = require("@nestjs/common");
const onramp_service_1 = require("./onramp.service");
const initialize_payment_dto_1 = require("./dto/initialize-payment.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let OnrampController = class OnrampController {
    onrampService;
    constructor(onrampService) {
        this.onrampService = onrampService;
    }
    async initializePayment(dto, req) {
        const userEmail = req.user?.useremail;
        return await this.onrampService.initializePayment(dto, userEmail);
    }
    async handleWebhook(payload, req) {
        const signature = req.headers['x-orion-signature'];
        return await this.onrampService.handleWebhook(payload, signature);
    }
    async getUserTransactions(req, limit, skip) {
        const userEmail = req.user?.useremail;
        const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50;
        const skipNum = skip ? parseInt(skip, 10) : 0;
        return await this.onrampService.getUserPayments(userEmail, limitNum, skipNum);
    }
    async getTransactionByReference(reference, req) {
        const userEmail = req.user?.useremail;
        return await this.onrampService.getPaymentByReference(reference, userEmail);
    }
    async getTransactionByOrderId(orderID, req) {
        const userEmail = req.user?.useremail;
        return await this.onrampService.getPaymentByOrderId(orderID, userEmail);
    }
    async verifyTransaction(reference, req) {
        const userEmail = req.user?.useremail;
        const isVerified = await this.onrampService.verifyPayment(reference, userEmail);
        return {
            success: true,
            reference,
            verified: isVerified,
            status: isVerified ? 'SUCCESS' : 'NOT_COMPLETED',
        };
    }
    async getUserStats(req) {
        const userEmail = req.user?.useremail;
        return await this.onrampService.getUserStats(userEmail);
    }
    async healthCheck() {
        return {
            status: 'ok',
            service: 'onramp',
            timestamp: new Date().toISOString(),
        };
    }
};
exports.OnrampController = OnrampController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('initialize'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [initialize_payment_dto_1.InitializePaymentDto, Object]),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "initializePayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('transactions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('skip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "getUserTransactions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('transaction/reference/:reference'),
    __param(0, (0, common_1.Param)('reference')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "getTransactionByReference", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('transaction/order/:orderID'),
    __param(0, (0, common_1.Param)('orderID')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "getTransactionByOrderId", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('transaction/:reference/verify'),
    __param(0, (0, common_1.Param)('reference')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "verifyTransaction", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('stats'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "getUserStats", null);
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OnrampController.prototype, "healthCheck", null);
exports.OnrampController = OnrampController = __decorate([
    (0, common_1.Controller)('onramp'),
    __metadata("design:paramtypes", [onramp_service_1.OnrampService])
], OnrampController);
//# sourceMappingURL=onramp.controller.js.map