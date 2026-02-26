import { ConfigService } from '@nestjs/config';
export declare class TradeService {
    private readonly configService;
    private readonly logger;
    private client;
    private backendOperatorId;
    private kmsClient;
    private kmsKeyId;
    private initPromise;
    constructor(configService: ConfigService);
    private ensureInitialized;
    private initializeClient;
    private readonly kmsTransactionSigner;
    private fetchOperatorPublicKeyFromKms;
    private compressedPublicKeyHexFromSpkiDer;
    private base64UrlToBuffer;
    private derToRawSignature;
    createDvPTransaction(buyerAccountId: string, equityTokenIdStr: string, stableCoinIdStr: string, treasuryAccountId: string, amount: number, totalPrice: number): Promise<{
        transactionBytes: string;
        message: string;
    }>;
}
