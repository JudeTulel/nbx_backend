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
exports.TradeService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = require("@hashgraph/sdk");
let TradeService = class TradeService {
    client;
    backendOperatorId;
    backendOperatorKey;
    constructor() {
        const operatorIdStr = process.env.OPERATOR_ID;
        const operatorKeyStr = process.env.OPERATOR_KEY;
        if (!operatorIdStr || !operatorKeyStr) {
            console.warn("OPERATOR_ID or OPERATOR_KEY not set in environment variables. TradeService will fail to initialize properly.");
            return;
        }
        this.backendOperatorId = sdk_1.AccountId.fromString(operatorIdStr);
        this.backendOperatorKey = sdk_1.PrivateKey.fromString(operatorKeyStr);
        this.client = sdk_1.Client.forTestnet();
        this.client.setOperator(this.backendOperatorId, this.backendOperatorKey);
    }
    async createDvPTransaction(buyerAccountId, equityTokenIdStr, stableCoinIdStr, treasuryAccountId, amount, totalPrice) {
        if (!this.client) {
            throw new Error("Hedera Client not initialized. Check OPERATOR_ID and OPERATOR_KEY env vars.");
        }
        const equityTokenId = sdk_1.TokenId.fromString(equityTokenIdStr);
        const stableCoinId = sdk_1.TokenId.fromString(stableCoinIdStr);
        const issuerId = sdk_1.AccountId.fromString(treasuryAccountId);
        const buyerId = sdk_1.AccountId.fromString(buyerAccountId);
        const transaction = new sdk_1.TransferTransaction()
            .addApprovedTokenTransfer(equityTokenId, issuerId, -amount)
            .addTokenTransfer(equityTokenId, buyerId, amount)
            .addTokenTransfer(stableCoinId, buyerId, -totalPrice)
            .addTokenTransfer(stableCoinId, issuerId, totalPrice)
            .freezeWith(this.client);
        const signedTx = await transaction.sign(this.backendOperatorKey);
        return {
            transactionBytes: Buffer.from(signedTx.toBytes()).toString('base64'),
            message: "Transaction created and signed by Broker. Waiting for Buyer signature."
        };
    }
};
exports.TradeService = TradeService;
exports.TradeService = TradeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], TradeService);
//# sourceMappingURL=trade.service.js.map