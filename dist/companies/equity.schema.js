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
exports.EquitySchema = exports.Equity = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Equity = class Equity extends mongoose_2.Document {
    companyId;
    name;
    symbol;
    isin;
    decimals;
    totalSupply;
    nominalValue;
    currency;
    dividendYield;
    dividendType;
    votingRights;
    informationRights;
    liquidationRights;
    subscriptionRights;
    conversionRights;
    redemptionRights;
    putRight;
    isControllable;
    isBlocklist;
    isApprovalList;
    clearingModeEnabled;
    internalKycActivated;
    regulationType;
    regulationSubType;
    assetAddress;
    diamondAddress;
    transactionId;
    treasuryAccountId;
    network;
    companyName;
    status;
    isTokenized;
    paymentTokens;
    tokenizedAt;
};
exports.Equity = Equity;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Company', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Equity.prototype, "companyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Equity.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Equity.prototype, "symbol", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "isin", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 4 }),
    __metadata("design:type", Number)
], Equity.prototype, "decimals", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Equity.prototype, "totalSupply", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "nominalValue", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'USD' }),
    __metadata("design:type", String)
], Equity.prototype, "currency", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Equity.prototype, "dividendYield", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: 0 }),
    __metadata("design:type", Number)
], Equity.prototype, "dividendType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "votingRights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "informationRights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "liquidationRights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "subscriptionRights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "conversionRights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "redemptionRights", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "putRight", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Equity.prototype, "isControllable", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Equity.prototype, "isBlocklist", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "isApprovalList", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: false }),
    __metadata("design:type", Boolean)
], Equity.prototype, "clearingModeEnabled", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Equity.prototype, "internalKycActivated", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "regulationType", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "regulationSubType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Equity.prototype, "assetAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "diamondAddress", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "transactionId", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "treasuryAccountId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'testnet' }),
    __metadata("design:type", String)
], Equity.prototype, "network", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], Equity.prototype, "companyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 'active' }),
    __metadata("design:type", String)
], Equity.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Boolean, default: true }),
    __metadata("design:type", Boolean)
], Equity.prototype, "isTokenized", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: ['0.0.7228867'] }),
    __metadata("design:type", Array)
], Equity.prototype, "paymentTokens", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], Equity.prototype, "tokenizedAt", void 0);
exports.Equity = Equity = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Equity);
exports.EquitySchema = mongoose_1.SchemaFactory.createForClass(Equity);
//# sourceMappingURL=equity.schema.js.map