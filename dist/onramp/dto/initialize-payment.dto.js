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
exports.InitializePaymentDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class PaymentMetadata {
    orderID;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PaymentMetadata.prototype, "orderID", void 0);
class InitializePaymentDto {
    token;
    amount;
    email;
    callback_url;
    channels;
    currency;
    crypto_account;
    metadata;
}
exports.InitializePaymentDto = InitializePaymentDto;
__decorate([
    (0, class_validator_1.IsEnum)(['KESy_TESTNET'], {
        message: 'token must be KESy_TESTNET',
    }),
    __metadata("design:type", String)
], InitializePaymentDto.prototype, "token", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1, { message: 'amount must be at least 1' }),
    (0, class_validator_1.Max)(500000, { message: 'amount must not exceed 500,000' }),
    __metadata("design:type", Number)
], InitializePaymentDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsEmail)({}, { message: 'email must be a valid email address' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'email is required' }),
    __metadata("design:type", String)
], InitializePaymentDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitializePaymentDto.prototype, "callback_url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)([
        'card',
        'bank',
        'ussd',
        'qr',
        'mobile_money',
        'bank_transfer',
        'eft',
        'apple_pay',
        'payattitude',
    ], { each: true, message: 'Invalid payment channel' }),
    __metadata("design:type", Array)
], InitializePaymentDto.prototype, "channels", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(['KES'], {
        message: 'currency must be KES',
    }),
    __metadata("design:type", String)
], InitializePaymentDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InitializePaymentDto.prototype, "crypto_account", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => PaymentMetadata),
    (0, class_validator_1.IsNotEmpty)({ message: 'metadata is required' }),
    __metadata("design:type", PaymentMetadata)
], InitializePaymentDto.prototype, "metadata", void 0);
//# sourceMappingURL=initialize-payment.dto.js.map