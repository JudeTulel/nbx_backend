import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { PaymentDocument } from './payment.schema';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { UserService } from '../users/users.service';
export declare class OnrampService {
    private paymentModel;
    private readonly configService;
    private readonly userService;
    private readonly logger;
    private readonly orionApiUrl;
    private readonly orionApiKey;
    constructor(paymentModel: Model<PaymentDocument>, configService: ConfigService, userService: UserService);
    initializePayment(dto: InitializePaymentDto, userEmail?: string): Promise<{
        success: boolean;
        reference: any;
        authorization_url: any;
        access_code: any;
        orderID: string;
    }>;
    getUserPayments(email: string, limit?: number, skip?: number): Promise<{
        success: boolean;
        payments: {
            reference: any;
            orderID: any;
            email: any;
            amount: any;
            currency: any;
            token: any;
            status: any;
            authorizationUrl: any;
            cryptoAccount: any;
            channels: any;
            callbackUrl: any;
            createdAt: any;
            updatedAt: any;
            completedAt: any;
            failedAt: any;
        }[];
        total: number;
        limit: number;
        skip: number;
        hasMore: boolean;
    }>;
    getPaymentByReference(reference: string, userEmail?: string): Promise<{
        success: boolean;
        payment: {
            reference: any;
            orderID: any;
            email: any;
            amount: any;
            currency: any;
            token: any;
            status: any;
            authorizationUrl: any;
            cryptoAccount: any;
            channels: any;
            callbackUrl: any;
            createdAt: any;
            updatedAt: any;
            completedAt: any;
            failedAt: any;
        };
    }>;
    getPaymentByOrderId(orderID: string, userEmail?: string): Promise<{
        success: boolean;
        payment: {
            reference: any;
            orderID: any;
            email: any;
            amount: any;
            currency: any;
            token: any;
            status: any;
            authorizationUrl: any;
            cryptoAccount: any;
            channels: any;
            callbackUrl: any;
            createdAt: any;
            updatedAt: any;
            completedAt: any;
            failedAt: any;
        };
    }>;
    getUserStats(email: string): Promise<{
        success: boolean;
        stats: {
            totalPayments: number;
            successfulPayments: number;
            pendingPayments: number;
            failedPayments: number;
            totalAmountSpent: any;
            currency: string;
            recentPayments: number;
            successRate: string;
            lastSuccessfulPayment: {
                amount: number;
                currency: string;
                date: Date | undefined;
            } | null;
        };
    }>;
    verifyPayment(reference: string, userEmail?: string): Promise<boolean>;
    handleWebhook(payload: any, signature?: string): Promise<{
        success: boolean;
        message: string;
        reference: string;
        status: string;
        previousStatus: string;
        eventType: any;
    }>;
    private mapEventTypeToStatus;
    private normalizeStatus;
    private sanitizePayment;
}
