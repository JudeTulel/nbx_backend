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
var OnrampService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnrampService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const payment_schema_1 = require("./payment.schema");
const users_service_1 = require("../users/users.service");
let OnrampService = OnrampService_1 = class OnrampService {
    paymentModel;
    configService;
    userService;
    logger = new common_1.Logger(OnrampService_1.name);
    orionApiUrl;
    orionApiKey;
    constructor(paymentModel, configService, userService) {
        this.paymentModel = paymentModel;
        this.configService = configService;
        this.userService = userService;
        this.orionApiUrl = this.configService.get('ORION_API_URL') ||
            'https://test.api.orionramp.com';
        this.orionApiKey = this.configService.get('ORION_PRIVATE_KEY') || '';
        if (!this.orionApiKey) {
            this.logger.warn('ORION_PRIVATE_KEY not configured. Onramp functionality will be limited.');
        }
    }
    async initializePayment(dto, userEmail) {
        try {
            this.logger.log(`[ONRAMP] Initializing payment for ${dto.email}, amount: ${dto.amount}`);
            if (!dto.token || !dto.amount || !dto.email || !dto.currency || !dto.metadata?.orderID) {
                throw new common_1.BadRequestException('Missing required fields: token, amount, email, currency, and metadata.orderID are required');
            }
            if (dto.amount < 1 || dto.amount > 500000) {
                throw new common_1.BadRequestException('Amount must be between 1 and 500,000');
            }
            const existingPayment = await this.paymentModel.findOne({ orderID: dto.metadata.orderID });
            if (existingPayment) {
                throw new common_1.BadRequestException(`Order ID ${dto.metadata.orderID} already exists`);
            }
            let cryptoAccount = dto.crypto_account;
            if (!cryptoAccount && userEmail) {
                try {
                    const user = await this.userService.findOne(userEmail);
                    if (user && user.hederaAccountId) {
                        cryptoAccount = user.hederaAccountId;
                        this.logger.log(`[ONRAMP] Using user's Hedera account: ${cryptoAccount}`);
                    }
                }
                catch (error) {
                    this.logger.warn(`[ONRAMP] Could not retrieve user Hedera account: ${error.message}`);
                }
            }
            const payload = {
                token: dto.token,
                amount: dto.amount,
                email: dto.email,
                currency: dto.currency,
                metadata: dto.metadata,
            };
            if (dto.callback_url) {
                payload.callback_url = dto.callback_url;
            }
            if (dto.channels && dto.channels.length > 0) {
                payload.channels = dto.channels;
            }
            if (cryptoAccount) {
                payload.crypto_account = cryptoAccount;
            }
            this.logger.log(`[ONRAMP] Request payload: ${JSON.stringify(payload)}`);
            const response = await fetch(`${this.orionApiUrl}/api/transaction/initialize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.orionApiKey}`,
                },
                body: JSON.stringify(payload),
            });
            const responseText = await response.text();
            this.logger.log(`[ONRAMP] API response status: ${response.status}`);
            this.logger.log(`[ONRAMP] API response body: ${responseText}`);
            if (!response.ok) {
                this.logger.error(`[ONRAMP] API error: ${response.status} - ${responseText}`);
                throw new common_1.BadRequestException(`Orion API error: ${response.status} - ${responseText}`);
            }
            let result;
            try {
                result = JSON.parse(responseText);
            }
            catch (parseError) {
                this.logger.error(`[ONRAMP] Failed to parse response: ${parseError.message}`);
                throw new common_1.InternalServerErrorException('Invalid response from payment gateway');
            }
            if (!result.reference || !result.authorization_url || !result.access_code) {
                this.logger.error(`[ONRAMP] Invalid response structure: ${JSON.stringify(result)}`);
                throw new common_1.InternalServerErrorException('Invalid response from payment gateway');
            }
            const payment = new this.paymentModel({
                reference: result.reference,
                orderID: dto.metadata.orderID,
                email: dto.email,
                amount: dto.amount,
                currency: dto.currency,
                token: dto.token,
                status: 'PENDING',
                authorizationUrl: result.authorization_url,
                accessCode: result.access_code,
                cryptoAccount: cryptoAccount,
                channels: dto.channels,
                callbackUrl: dto.callback_url,
                initiatedBy: userEmail,
                createdAt: new Date(),
            });
            await payment.save();
            this.logger.log(`[ONRAMP] Payment record saved: ${result.reference}`);
            return {
                success: true,
                reference: result.reference,
                authorization_url: result.authorization_url,
                access_code: result.access_code,
                orderID: dto.metadata.orderID,
            };
        }
        catch (error) {
            this.logger.error(`[ONRAMP] Error initializing payment: ${error?.message}`);
            this.logger.error(`[ONRAMP] Stack: ${error?.stack}`);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.InternalServerErrorException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to initialize payment. Please try again later.');
        }
    }
    async getUserPayments(email, limit = 50, skip = 0) {
        try {
            this.logger.log(`[ONRAMP] Getting payments for user: ${email}`);
            const payments = await this.paymentModel
                .find({ email })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .select('-__v -webhookData')
                .lean();
            const total = await this.paymentModel.countDocuments({ email });
            return {
                success: true,
                payments: payments.map(p => this.sanitizePayment(p)),
                total,
                limit,
                skip,
                hasMore: skip + payments.length < total,
            };
        }
        catch (error) {
            this.logger.error(`[ONRAMP] Error getting user payments: ${error?.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve user payments');
        }
    }
    async getPaymentByReference(reference, userEmail) {
        try {
            this.logger.log(`[ONRAMP] Getting payment by reference: ${reference}`);
            const payment = await this.paymentModel
                .findOne({ reference })
                .select('-__v -webhookData')
                .lean();
            if (!payment) {
                throw new common_1.BadRequestException('Payment not found');
            }
            if (userEmail && payment.email !== userEmail && payment.initiatedBy !== userEmail) {
                throw new common_1.BadRequestException('You do not have permission to view this payment');
            }
            return {
                success: true,
                payment: this.sanitizePayment(payment),
            };
        }
        catch (error) {
            this.logger.error(`[ONRAMP] Error getting payment: ${error?.message}`);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve payment');
        }
    }
    async getPaymentByOrderId(orderID, userEmail) {
        try {
            this.logger.log(`[ONRAMP] Getting payment by orderID: ${orderID}`);
            const payment = await this.paymentModel
                .findOne({ orderID })
                .select('-__v -webhookData')
                .lean();
            if (!payment) {
                throw new common_1.BadRequestException('Payment not found');
            }
            if (userEmail && payment.email !== userEmail && payment.initiatedBy !== userEmail) {
                throw new common_1.BadRequestException('You do not have permission to view this payment');
            }
            return {
                success: true,
                payment: this.sanitizePayment(payment),
            };
        }
        catch (error) {
            this.logger.error(`[ONRAMP] Error getting payment: ${error?.message}`);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to retrieve payment');
        }
    }
    async getUserStats(email) {
        try {
            this.logger.log(`[ONRAMP] Getting stats for user: ${email}`);
            const totalPayments = await this.paymentModel.countDocuments({ email });
            const successfulPayments = await this.paymentModel.countDocuments({ email, status: 'SUCCESS' });
            const pendingPayments = await this.paymentModel.countDocuments({ email, status: 'PENDING' });
            const failedPayments = await this.paymentModel.countDocuments({ email, status: 'FAILED' });
            const totalAmountResult = await this.paymentModel.aggregate([
                { $match: { email, status: 'SUCCESS' } },
                { $group: { _id: null, total: { $sum: '$amount' } } },
            ]);
            const totalAmount = totalAmountResult[0]?.total || 0;
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentPayments = await this.paymentModel.countDocuments({
                email,
                createdAt: { $gte: sevenDaysAgo }
            });
            const lastSuccessfulPayment = await this.paymentModel
                .findOne({ email, status: 'SUCCESS' })
                .sort({ completedAt: -1 })
                .select('amount currency completedAt')
                .lean();
            return {
                success: true,
                stats: {
                    totalPayments,
                    successfulPayments,
                    pendingPayments,
                    failedPayments,
                    totalAmountSpent: totalAmount,
                    currency: 'KES',
                    recentPayments,
                    successRate: totalPayments > 0 ? ((successfulPayments / totalPayments) * 100).toFixed(2) : '0.00',
                    lastSuccessfulPayment: lastSuccessfulPayment ? {
                        amount: lastSuccessfulPayment.amount,
                        currency: lastSuccessfulPayment.currency,
                        date: lastSuccessfulPayment.completedAt,
                    } : null,
                }
            };
        }
        catch (error) {
            this.logger.error(`[ONRAMP] Error getting user stats: ${error?.message}`);
            throw new common_1.InternalServerErrorException('Failed to retrieve payment statistics');
        }
    }
    async verifyPayment(reference, userEmail) {
        try {
            const query = { reference };
            if (userEmail) {
                query.$or = [{ email: userEmail }, { initiatedBy: userEmail }];
            }
            const payment = await this.paymentModel.findOne(query);
            return payment?.status === 'SUCCESS';
        }
        catch (error) {
            this.logger.error(`[ONRAMP] Error verifying payment: ${error?.message}`);
            return false;
        }
    }
    async handleWebhook(payload, signature) {
        try {
            this.logger.log(`[ONRAMP] Webhook received: ${JSON.stringify(payload)}`);
            if (!payload || typeof payload !== 'object') {
                throw new common_1.BadRequestException('Invalid webhook payload');
            }
            const webhookSecret = this.configService.get('ORION_WEBHOOK_SECRET');
            if (webhookSecret && signature) {
                const crypto = require('crypto');
                const expectedSignature = crypto
                    .createHmac('sha512', webhookSecret)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                if (signature !== expectedSignature) {
                    this.logger.warn('[ONRAMP] Invalid webhook signature');
                    throw new common_1.BadRequestException('Invalid webhook signature');
                }
                this.logger.log('[ONRAMP] Webhook signature validated successfully');
            }
            else if (webhookSecret && !signature) {
                this.logger.warn('[ONRAMP] Webhook received without signature');
            }
            const { event_type, order_id, token, amount, currency, failureReason } = payload;
            if (!order_id && !payload.orderID) {
                this.logger.error('[ONRAMP] Webhook missing order_id/orderID field');
                throw new common_1.BadRequestException('Invalid webhook payload: missing order_id');
            }
            const orderID = order_id || payload.orderID;
            const payment = await this.paymentModel.findOne({ orderID });
            if (!payment) {
                this.logger.warn(`[ONRAMP] Payment not found for orderID: ${orderID}`);
                throw new common_1.BadRequestException('Payment not found');
            }
            const oldStatus = payment.status;
            const newStatus = this.mapEventTypeToStatus(event_type);
            payment.status = newStatus;
            payment.webhookData = payload;
            payment.updatedAt = new Date();
            if (newStatus === 'SUCCESS' && oldStatus !== 'SUCCESS') {
                payment.completedAt = new Date();
                this.logger.log(`[ONRAMP] Payment completed: ${payment.reference}`);
            }
            else if (newStatus === 'FAILED' && oldStatus !== 'FAILED') {
                payment.failedAt = new Date();
                if (failureReason) {
                    this.logger.log(`[ONRAMP] Payment failed: ${payment.reference} - Reason: ${failureReason}`);
                }
                else {
                    this.logger.log(`[ONRAMP] Payment failed: ${payment.reference}`);
                }
            }
            await payment.save();
            this.logger.log(`[ONRAMP] Payment status updated: ${payment.reference} - ${oldStatus} -> ${payment.status} (event: ${event_type})`);
            return {
                success: true,
                message: 'Webhook processed successfully',
                reference: payment.reference,
                status: payment.status,
                previousStatus: oldStatus,
                eventType: event_type,
            };
        }
        catch (error) {
            this.logger.error(`[ONRAMP] Error handling webhook: ${error?.message}`);
            this.logger.error(`[ONRAMP] Stack: ${error?.stack}`);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Failed to process webhook');
        }
    }
    mapEventTypeToStatus(eventType) {
        if (!eventType)
            return 'PENDING';
        const eventMap = {
            'charge_success': 'PENDING',
            'charge_failed': 'FAILED',
            'token_transfer_pending': 'PENDING',
            'token_transfer_success': 'SUCCESS',
            'token_transfer_failed': 'FAILED',
            'account_not_associated': 'FAILED',
        };
        const status = eventMap[eventType.toLowerCase()];
        if (status) {
            return status;
        }
        return this.normalizeStatus(eventType);
    }
    normalizeStatus(status) {
        if (!status)
            return 'PENDING';
        const upperStatus = status.toUpperCase();
        if (upperStatus === 'SUCCESS' || upperStatus === 'SUCCESSFUL' ||
            upperStatus === 'COMPLETED' || upperStatus === 'COMPLETE') {
            return 'SUCCESS';
        }
        if (upperStatus === 'FAILED' || upperStatus === 'FAILURE' ||
            upperStatus === 'DECLINED' || upperStatus === 'REJECTED') {
            return 'FAILED';
        }
        if (upperStatus === 'PENDING' || upperStatus === 'PROCESSING' ||
            upperStatus === 'INITIATED') {
            return 'PENDING';
        }
        this.logger.warn(`[ONRAMP] Unknown status received: ${status}`);
        return upperStatus;
    }
    sanitizePayment(payment) {
        return {
            reference: payment.reference,
            orderID: payment.orderID,
            email: payment.email,
            amount: payment.amount,
            currency: payment.currency,
            token: payment.token,
            status: payment.status,
            authorizationUrl: payment.authorizationUrl,
            cryptoAccount: payment.cryptoAccount,
            channels: payment.channels,
            callbackUrl: payment.callbackUrl,
            createdAt: payment.createdAt,
            updatedAt: payment.updatedAt,
            completedAt: payment.completedAt,
            failedAt: payment.failedAt,
        };
    }
};
exports.OnrampService = OnrampService;
exports.OnrampService = OnrampService = OnrampService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(payment_schema_1.Payment.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        config_1.ConfigService,
        users_service_1.UserService])
], OnrampService);
//# sourceMappingURL=onramp.service.js.map