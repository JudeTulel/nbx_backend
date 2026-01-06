import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './payment.schema';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { UserService } from '../users/users.service';

@Injectable()
export class OnrampService {
  private readonly logger = new Logger(OnrampService.name);
  private readonly orionApiUrl: string;
  private readonly orionApiKey: string;

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    this.orionApiUrl = this.configService.get<string>('ORION_API_URL') ||
      'https://test.api.orionramp.com';
    this.orionApiKey = this.configService.get<string>('ORION_PRIVATE_KEY') || '';

    if (!this.orionApiKey) {
      this.logger.warn('ORION_PRIVATE_KEY not configured. Onramp functionality will be limited.');
    }
  }

  /**
   * Initialize a payment with Orion Ramp
   */
  async initializePayment(dto: InitializePaymentDto, userEmail?: string) {
    try {
      this.logger.log(`[ONRAMP] Initializing payment for ${dto.email}, amount: ${dto.amount}`);

      // Validate required fields
      if (!dto.token || !dto.amount || !dto.email || !dto.currency || !dto.metadata?.orderID) {
        throw new BadRequestException('Missing required fields: token, amount, email, currency, and metadata.orderID are required');
      }

      // Validate amount range
      if (dto.amount < 1 || dto.amount > 500000) {
        throw new BadRequestException('Amount must be between 1 and 500,000');
      }

      // Check if orderID already exists
      const existingPayment = await this.paymentModel.findOne({ orderID: dto.metadata.orderID });
      if (existingPayment) {
        throw new BadRequestException(`Order ID ${dto.metadata.orderID} already exists`);
      }

      // If crypto_account not provided, try to get user's Hedera account
      let cryptoAccount = dto.crypto_account;
      if (!cryptoAccount && userEmail) {
        try {
          const user = await this.userService.findOne(userEmail);
          if (user && user.hederaAccountId) {
            cryptoAccount = user.hederaAccountId;
            this.logger.log(`[ONRAMP] Using user's Hedera account: ${cryptoAccount}`);
          }
        } catch (error) {
          this.logger.warn(`[ONRAMP] Could not retrieve user Hedera account: ${error.message}`);
        }
      }

      // Prepare request payload
      const payload: any = {
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

      // Make API call to Orion Ramp
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
        throw new BadRequestException(`Orion API error: ${response.status} - ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        this.logger.error(`[ONRAMP] Failed to parse response: ${parseError.message}`);
        throw new InternalServerErrorException('Invalid response from payment gateway');
      }

      // Validate response structure
      if (!result.reference || !result.authorization_url || !result.access_code) {
        this.logger.error(`[ONRAMP] Invalid response structure: ${JSON.stringify(result)}`);
        throw new InternalServerErrorException('Invalid response from payment gateway');
      }

      // Save payment record to database
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
    } catch (error: any) {
      this.logger.error(`[ONRAMP] Error initializing payment: ${error?.message}`);
      this.logger.error(`[ONRAMP] Stack: ${error?.stack}`);

      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to initialize payment. Please try again later.');
    }
  }

  /**
   * Get all payments for a user
   */
  async getUserPayments(email: string, limit = 50, skip = 0) {
    try {
      this.logger.log(`[ONRAMP] Getting payments for user: ${email}`);

      const payments = await this.paymentModel
        .find({ email })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .select('-__v -webhookData') // Exclude internal fields
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
    } catch (error: any) {
      this.logger.error(`[ONRAMP] Error getting user payments: ${error?.message}`);
      throw new InternalServerErrorException('Failed to retrieve user payments');
    }
  }

  /**
   * Get payment details by reference
   */
  async getPaymentByReference(reference: string, userEmail?: string) {
    try {
      this.logger.log(`[ONRAMP] Getting payment by reference: ${reference}`);

      const payment = await this.paymentModel
        .findOne({ reference })
        .select('-__v -webhookData')
        .lean();

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      // Optional: Check if user has permission to view this payment
      if (userEmail && payment.email !== userEmail && payment.initiatedBy !== userEmail) {
        throw new BadRequestException('You do not have permission to view this payment');
      }

      return {
        success: true,
        payment: this.sanitizePayment(payment),
      };
    } catch (error: any) {
      this.logger.error(`[ONRAMP] Error getting payment: ${error?.message}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to retrieve payment');
    }
  }

  /**
   * Get payment details by orderID
   */
  async getPaymentByOrderId(orderID: string, userEmail?: string) {
    try {
      this.logger.log(`[ONRAMP] Getting payment by orderID: ${orderID}`);

      const payment = await this.paymentModel
        .findOne({ orderID })
        .select('-__v -webhookData')
        .lean();

      if (!payment) {
        throw new BadRequestException('Payment not found');
      }

      // Optional: Check if user has permission to view this payment
      if (userEmail && payment.email !== userEmail && payment.initiatedBy !== userEmail) {
        throw new BadRequestException('You do not have permission to view this payment');
      }

      return {
        success: true,
        payment: this.sanitizePayment(payment),
      };
    } catch (error: any) {
      this.logger.error(`[ONRAMP] Error getting payment: ${error?.message}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to retrieve payment');
    }
  }

  /**
   * Get payment statistics for a user
   */
  async getUserStats(email: string) {
    try {
      this.logger.log(`[ONRAMP] Getting stats for user: ${email}`);

      const totalPayments = await this.paymentModel.countDocuments({ email });
      const successfulPayments = await this.paymentModel.countDocuments({ email, status: 'SUCCESS' });
      const pendingPayments = await this.paymentModel.countDocuments({ email, status: 'PENDING' });
      const failedPayments = await this.paymentModel.countDocuments({ email, status: 'FAILED' });

      // Calculate total amount spent (successful payments only)
      const totalAmountResult = await this.paymentModel.aggregate([
        { $match: { email, status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const totalAmount = totalAmountResult[0]?.total || 0;

      // Get recent payments (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentPayments = await this.paymentModel.countDocuments({
        email,
        createdAt: { $gte: sevenDaysAgo }
      });

      // Get last successful payment
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
    } catch (error: any) {
      this.logger.error(`[ONRAMP] Error getting user stats: ${error?.message}`);
      throw new InternalServerErrorException('Failed to retrieve payment statistics');
    }
  }

  /**
   * Verify payment completion
   */
  async verifyPayment(reference: string, userEmail?: string): Promise<boolean> {
    try {
      const query: any = { reference };
      if (userEmail) {
        query.$or = [{ email: userEmail }, { initiatedBy: userEmail }];
      }

      const payment = await this.paymentModel.findOne(query);
      return payment?.status === 'SUCCESS';
    } catch (error: any) {
      this.logger.error(`[ONRAMP] Error verifying payment: ${error?.message}`);
      return false;
    }
  }

  /**
   * Handle webhook from Orion Ramp
   * This is called when payment status changes
   */
  async handleWebhook(payload: any, signature?: string) {
    try {
      this.logger.log(`[ONRAMP] Webhook received: ${JSON.stringify(payload)}`);

      // Validate webhook payload
      if (!payload || typeof payload !== 'object') {
        throw new BadRequestException('Invalid webhook payload');
      }

      // Validate signature if webhook secret is configured
      const webhookSecret = this.configService.get<string>('ORION_WEBHOOK_SECRET');
      if (webhookSecret && signature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
          .createHmac('sha512', webhookSecret)
          .update(JSON.stringify(payload))
          .digest('hex');

        if (signature !== expectedSignature) {
          this.logger.warn('[ONRAMP] Invalid webhook signature');
          throw new BadRequestException('Invalid webhook signature');
        }
        this.logger.log('[ONRAMP] Webhook signature validated successfully');
      } else if (webhookSecret && !signature) {
        this.logger.warn('[ONRAMP] Webhook received without signature');
      }

      // Extract fields from Orion webhook format
      const { event_type, order_id, token, amount, currency, failureReason } = payload;

      if (!order_id && !payload.orderID) {
        this.logger.error('[ONRAMP] Webhook missing order_id/orderID field');
        throw new BadRequestException('Invalid webhook payload: missing order_id');
      }

      const orderID = order_id || payload.orderID;

      // Find payment record by orderID
      const payment = await this.paymentModel.findOne({ orderID });

      if (!payment) {
        this.logger.warn(`[ONRAMP] Payment not found for orderID: ${orderID}`);
        throw new BadRequestException('Payment not found');
      }

      // Store old status for logging
      const oldStatus = payment.status;

      // Map Orion event types to internal status
      const newStatus = this.mapEventTypeToStatus(event_type);

      // Update payment status
      payment.status = newStatus;
      payment.webhookData = payload;
      payment.updatedAt = new Date();

      // Set completion/failure timestamps
      if (newStatus === 'SUCCESS' && oldStatus !== 'SUCCESS') {
        payment.completedAt = new Date();
        this.logger.log(`[ONRAMP] Payment completed: ${payment.reference}`);
      } else if (newStatus === 'FAILED' && oldStatus !== 'FAILED') {
        payment.failedAt = new Date();
        if (failureReason) {
          this.logger.log(`[ONRAMP] Payment failed: ${payment.reference} - Reason: ${failureReason}`);
        } else {
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
    } catch (error: any) {
      this.logger.error(`[ONRAMP] Error handling webhook: ${error?.message}`);
      this.logger.error(`[ONRAMP] Stack: ${error?.stack}`);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to process webhook');
    }
  }

  /**
   * Map Orion event types to internal status
   */
  private mapEventTypeToStatus(eventType: string): string {
    if (!eventType) return 'PENDING';

    const eventMap: Record<string, string> = {
      'charge_success': 'PENDING', // Charged but tokens not yet transferred
      'charge_failed': 'FAILED',
      'token_transfer_pending': 'PENDING',
      'token_transfer_success': 'SUCCESS', // Final success - tokens transferred
      'token_transfer_failed': 'FAILED',
      'account_not_associated': 'FAILED',
    };

    const status = eventMap[eventType.toLowerCase()];
    if (status) {
      return status;
    }

    // Fallback to old status mapping for backward compatibility
    return this.normalizeStatus(eventType);
  }

  /**
   * Normalize status from webhook to standard format
   */
  private normalizeStatus(status: string): string {
    if (!status) return 'PENDING';

    const upperStatus = status.toUpperCase();

    // Success variants
    if (upperStatus === 'SUCCESS' || upperStatus === 'SUCCESSFUL' ||
      upperStatus === 'COMPLETED' || upperStatus === 'COMPLETE') {
      return 'SUCCESS';
    }

    // Failed variants
    if (upperStatus === 'FAILED' || upperStatus === 'FAILURE' ||
      upperStatus === 'DECLINED' || upperStatus === 'REJECTED') {
      return 'FAILED';
    }

    // Pending variants
    if (upperStatus === 'PENDING' || upperStatus === 'PROCESSING' ||
      upperStatus === 'INITIATED') {
      return 'PENDING';
    }

    // Return as-is if unknown (will be stored for debugging)
    this.logger.warn(`[ONRAMP] Unknown status received: ${status}`);
    return upperStatus;
  }

  /**
   * Sanitize payment data for response
   */
  private sanitizePayment(payment: any) {
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
}