export declare class TradeService {
    private client;
    private backendOperatorId;
    private backendOperatorKey;
    constructor();
    createDvPTransaction(buyerAccountId: string, equityTokenIdStr: string, stableCoinIdStr: string, treasuryAccountId: string, amount: number, totalPrice: number): Promise<{
        transactionBytes: string;
        message: string;
    }>;
}
