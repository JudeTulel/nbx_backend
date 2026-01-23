import { OnrampService } from './onramp.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
export declare class OnrampController {
    private readonly onrampService;
    constructor(onrampService: OnrampService);
    initializePayment(dto: InitializePaymentDto, req: any): Promise<{
        success: boolean;
        reference: any;
        authorization_url: any;
        access_code: any;
        orderID: string;
    }>;
    handleWebhook(payload: any, req: any): Promise<{
        success: boolean;
        message: string;
        reference: string;
        status: string;
        previousStatus: string;
        eventType: any;
    }>;
    getUserTransactions(req: any, limit?: string, skip?: string): Promise<{
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
    getTransactionByReference(reference: string, req: any): Promise<{
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
    getTransactionByOrderId(orderID: string, req: any): Promise<{
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
    verifyTransaction(reference: string, req: any): Promise<{
        success: boolean;
        reference: string;
        verified: boolean;
        status: string;
    }>;
    getUserStats(req: any): Promise<{
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
    healthCheck(): Promise<{
        status: string;
        service: string;
        timestamp: string;
    }>;
}
