declare class PaymentMetadata {
    orderID: string;
}
export declare class InitializePaymentDto {
    token: 'KESy_TESTNET';
    amount: number;
    email: string;
    callback_url?: string;
    channels?: string[];
    currency: 'KES';
    crypto_account?: string;
    metadata: PaymentMetadata;
}
export {};
