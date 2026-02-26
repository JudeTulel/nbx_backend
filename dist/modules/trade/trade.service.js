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
var TradeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradeService = void 0;
const common_1 = require("@nestjs/common");
const sdk_1 = require("@hashgraph/sdk");
const config_1 = require("@nestjs/config");
const client_kms_1 = require("@aws-sdk/client-kms");
const crypto_1 = require("crypto");
const js_sha3_1 = require("js-sha3");
let TradeService = TradeService_1 = class TradeService {
    configService;
    logger = new common_1.Logger(TradeService_1.name);
    client;
    backendOperatorId;
    kmsClient;
    kmsKeyId;
    initPromise = null;
    constructor(configService) {
        this.configService = configService;
    }
    async ensureInitialized() {
        if (!this.initPromise) {
            this.initPromise = this.initializeClient();
        }
        await this.initPromise;
    }
    async initializeClient() {
        const operatorIdStr = this.configService.get('OPERATOR_ID');
        const kmsKeyId = this.configService.get('AWS_KMS_KEY_ID');
        const awsRegion = this.configService.get('AWS_REGION') || 'us-east-1';
        const hederaNetwork = (this.configService.get('HEDERA_NETWORK') || 'testnet').toLowerCase();
        if (!operatorIdStr || !kmsKeyId) {
            throw new common_1.InternalServerErrorException('OPERATOR_ID and AWS_KMS_KEY_ID must be configured for trade signing');
        }
        this.kmsKeyId = kmsKeyId;
        this.backendOperatorId = sdk_1.AccountId.fromString(operatorIdStr);
        this.kmsClient = new client_kms_1.KMSClient({ region: awsRegion });
        if (hederaNetwork === 'mainnet') {
            this.client = sdk_1.Client.forMainnet();
        }
        else if (hederaNetwork === 'previewnet') {
            this.client = sdk_1.Client.forPreviewnet();
        }
        else {
            this.client = sdk_1.Client.forTestnet();
        }
        const operatorPublicKey = await this.fetchOperatorPublicKeyFromKms();
        this.client.setOperatorWith(this.backendOperatorId, operatorPublicKey, this.kmsTransactionSigner);
        this.logger.log(`Trade signer initialized with AWS KMS key ${this.kmsKeyId} on ${hederaNetwork}`);
    }
    kmsTransactionSigner = async (message) => {
        const digest = Buffer.from(js_sha3_1.keccak_256.arrayBuffer(Buffer.from(message)));
        const signResponse = await this.kmsClient.send(new client_kms_1.SignCommand({
            KeyId: this.kmsKeyId,
            Message: digest,
            MessageType: 'DIGEST',
            SigningAlgorithm: 'ECDSA_SHA_256',
        }));
        if (!signResponse.Signature) {
            throw new common_1.InternalServerErrorException('KMS returned an empty signature');
        }
        return this.derToRawSignature(Buffer.from(signResponse.Signature));
    };
    async fetchOperatorPublicKeyFromKms() {
        const response = await this.kmsClient.send(new client_kms_1.GetPublicKeyCommand({ KeyId: this.kmsKeyId }));
        if (!response.PublicKey) {
            throw new common_1.InternalServerErrorException('KMS did not return a public key');
        }
        const compressedHex = this.compressedPublicKeyHexFromSpkiDer(Buffer.from(response.PublicKey));
        return sdk_1.PublicKey.fromStringECDSA(compressedHex);
    }
    compressedPublicKeyHexFromSpkiDer(der) {
        const keyObject = (0, crypto_1.createPublicKey)({ key: der, format: 'der', type: 'spki' });
        const jwk = keyObject.export({ format: 'jwk' });
        if (!jwk.x || !jwk.y) {
            throw new common_1.InternalServerErrorException('Failed to extract EC coordinates from KMS key');
        }
        const x = this.base64UrlToBuffer(jwk.x);
        const y = this.base64UrlToBuffer(jwk.y);
        const prefix = (y[y.length - 1] & 1) === 0 ? 0x02 : 0x03;
        return Buffer.concat([Buffer.from([prefix]), x]).toString('hex');
    }
    base64UrlToBuffer(value) {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
        return Buffer.from(normalized + padding, 'base64');
    }
    derToRawSignature(derSignature) {
        const readLength = (offset) => {
            const first = derSignature[offset];
            if ((first & 0x80) === 0) {
                return { length: first, bytesRead: 1 };
            }
            const byteCount = first & 0x7f;
            if (byteCount === 0 || byteCount > 4) {
                throw new common_1.InternalServerErrorException('Invalid DER signature length');
            }
            let length = 0;
            for (let i = 0; i < byteCount; i++) {
                length = (length << 8) | derSignature[offset + 1 + i];
            }
            return { length, bytesRead: 1 + byteCount };
        };
        const toFixed32 = (value) => {
            let normalized = value;
            while (normalized.length > 0 && normalized[0] === 0x00) {
                normalized = normalized.subarray(1);
            }
            if (normalized.length > 32) {
                throw new common_1.InternalServerErrorException('Invalid ECDSA signature component length');
            }
            if (normalized.length === 32) {
                return normalized;
            }
            return Buffer.concat([Buffer.alloc(32 - normalized.length, 0), normalized]);
        };
        let offset = 0;
        if (derSignature[offset++] !== 0x30) {
            throw new common_1.InternalServerErrorException('Invalid DER signature format (sequence)');
        }
        const sequenceLength = readLength(offset);
        offset += sequenceLength.bytesRead;
        if (derSignature[offset++] !== 0x02) {
            throw new common_1.InternalServerErrorException('Invalid DER signature format (r integer)');
        }
        const rLength = readLength(offset);
        offset += rLength.bytesRead;
        const r = derSignature.subarray(offset, offset + rLength.length);
        offset += rLength.length;
        if (derSignature[offset++] !== 0x02) {
            throw new common_1.InternalServerErrorException('Invalid DER signature format (s integer)');
        }
        const sLength = readLength(offset);
        offset += sLength.bytesRead;
        const s = derSignature.subarray(offset, offset + sLength.length);
        return Uint8Array.from(Buffer.concat([toFixed32(r), toFixed32(s)]));
    }
    async createDvPTransaction(buyerAccountId, equityTokenIdStr, stableCoinIdStr, treasuryAccountId, amount, totalPrice) {
        await this.ensureInitialized();
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
        const signedTx = await transaction.signWithOperator(this.client);
        return {
            transactionBytes: Buffer.from(signedTx.toBytes()).toString('base64'),
            message: "Transaction created and signed by Broker. Waiting for Buyer signature."
        };
    }
};
exports.TradeService = TradeService;
exports.TradeService = TradeService = TradeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TradeService);
//# sourceMappingURL=trade.service.js.map