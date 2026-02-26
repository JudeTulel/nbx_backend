import {
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import {
    Client,
    TransferTransaction,
    AccountId,
    TokenId,
    PublicKey,
} from '@hashgraph/sdk';
import { ConfigService } from '@nestjs/config';
import { GetPublicKeyCommand, KMSClient, SignCommand } from '@aws-sdk/client-kms';
import { createPublicKey } from 'crypto';
import { keccak_256 } from 'js-sha3';

@Injectable()
export class TradeService {
    private readonly logger = new Logger(TradeService.name);
    private client: Client;
    private backendOperatorId: AccountId;
    private kmsClient: KMSClient;
    private kmsKeyId: string;
    private initPromise: Promise<void> | null = null;

    constructor(private readonly configService: ConfigService) { }

    private async ensureInitialized(): Promise<void> {
        if (!this.initPromise) {
            this.initPromise = this.initializeClient();
        }
        await this.initPromise;
    }

    private async initializeClient(): Promise<void> {
        const operatorIdStr = this.configService.get<string>('OPERATOR_ID');
        const kmsKeyId = this.configService.get<string>('AWS_KMS_KEY_ID');
        const awsRegion = this.configService.get<string>('AWS_REGION') || 'us-east-1';
        const hederaNetwork =
            (this.configService.get<string>('HEDERA_NETWORK') || 'testnet').toLowerCase();

        if (!operatorIdStr || !kmsKeyId) {
            throw new InternalServerErrorException(
                'OPERATOR_ID and AWS_KMS_KEY_ID must be configured for trade signing',
            );
        }

        this.kmsKeyId = kmsKeyId;
        this.backendOperatorId = AccountId.fromString(operatorIdStr);
        this.kmsClient = new KMSClient({ region: awsRegion });

        if (hederaNetwork === 'mainnet') {
            this.client = Client.forMainnet();
        } else if (hederaNetwork === 'previewnet') {
            this.client = Client.forPreviewnet();
        } else {
            this.client = Client.forTestnet();
        }

        const operatorPublicKey = await this.fetchOperatorPublicKeyFromKms();
        this.client.setOperatorWith(
            this.backendOperatorId,
            operatorPublicKey,
            this.kmsTransactionSigner,
        );
        this.logger.log(
            `Trade signer initialized with AWS KMS key ${this.kmsKeyId} on ${hederaNetwork}`,
        );
    }

    private readonly kmsTransactionSigner = async (
        message: Uint8Array,
    ): Promise<Uint8Array> => {
        const digest = Buffer.from(keccak_256.arrayBuffer(Buffer.from(message)));
        const signResponse = await this.kmsClient.send(
            new SignCommand({
                KeyId: this.kmsKeyId,
                Message: digest,
                MessageType: 'DIGEST',
                SigningAlgorithm: 'ECDSA_SHA_256',
            }),
        );

        if (!signResponse.Signature) {
            throw new InternalServerErrorException('KMS returned an empty signature');
        }

        return this.derToRawSignature(Buffer.from(signResponse.Signature));
    };

    private async fetchOperatorPublicKeyFromKms(): Promise<PublicKey> {
        const response = await this.kmsClient.send(
            new GetPublicKeyCommand({ KeyId: this.kmsKeyId }),
        );

        if (!response.PublicKey) {
            throw new InternalServerErrorException('KMS did not return a public key');
        }

        const compressedHex = this.compressedPublicKeyHexFromSpkiDer(
            Buffer.from(response.PublicKey),
        );
        return PublicKey.fromStringECDSA(compressedHex);
    }

    private compressedPublicKeyHexFromSpkiDer(der: Buffer): string {
        const keyObject = createPublicKey({ key: der, format: 'der', type: 'spki' });
        const jwk = keyObject.export({ format: 'jwk' }) as { x?: string; y?: string };

        if (!jwk.x || !jwk.y) {
            throw new InternalServerErrorException('Failed to extract EC coordinates from KMS key');
        }

        const x = this.base64UrlToBuffer(jwk.x);
        const y = this.base64UrlToBuffer(jwk.y);
        const prefix = (y[y.length - 1] & 1) === 0 ? 0x02 : 0x03;

        return Buffer.concat([Buffer.from([prefix]), x]).toString('hex');
    }

    private base64UrlToBuffer(value: string): Buffer {
        const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
        return Buffer.from(normalized + padding, 'base64');
    }

    private derToRawSignature(derSignature: Buffer): Uint8Array {
        const readLength = (offset: number): { length: number; bytesRead: number } => {
            const first = derSignature[offset];
            if ((first & 0x80) === 0) {
                return { length: first, bytesRead: 1 };
            }
            const byteCount = first & 0x7f;
            if (byteCount === 0 || byteCount > 4) {
                throw new InternalServerErrorException('Invalid DER signature length');
            }
            let length = 0;
            for (let i = 0; i < byteCount; i++) {
                length = (length << 8) | derSignature[offset + 1 + i];
            }
            return { length, bytesRead: 1 + byteCount };
        };

        const toFixed32 = (value: Buffer): Buffer => {
            let normalized = value;
            while (normalized.length > 0 && normalized[0] === 0x00) {
                normalized = normalized.subarray(1);
            }
            if (normalized.length > 32) {
                throw new InternalServerErrorException('Invalid ECDSA signature component length');
            }
            if (normalized.length === 32) {
                return normalized;
            }
            return Buffer.concat([Buffer.alloc(32 - normalized.length, 0), normalized]);
        };

        let offset = 0;
        if (derSignature[offset++] !== 0x30) {
            throw new InternalServerErrorException('Invalid DER signature format (sequence)');
        }
        const sequenceLength = readLength(offset);
        offset += sequenceLength.bytesRead;

        if (derSignature[offset++] !== 0x02) {
            throw new InternalServerErrorException('Invalid DER signature format (r integer)');
        }
        const rLength = readLength(offset);
        offset += rLength.bytesRead;
        const r = derSignature.subarray(offset, offset + rLength.length);
        offset += rLength.length;

        if (derSignature[offset++] !== 0x02) {
            throw new InternalServerErrorException('Invalid DER signature format (s integer)');
        }
        const sLength = readLength(offset);
        offset += sLength.bytesRead;
        const s = derSignature.subarray(offset, offset + sLength.length);

        return Uint8Array.from(Buffer.concat([toFixed32(r), toFixed32(s)]));
    }

    async createDvPTransaction(
        buyerAccountId: string,
        equityTokenIdStr: string,
        stableCoinIdStr: string,
        treasuryAccountId: string,
        amount: number,
        totalPrice: number
    ) {
        await this.ensureInitialized();

        const equityTokenId = TokenId.fromString(equityTokenIdStr);
        const stableCoinId = TokenId.fromString(stableCoinIdStr);
        const issuerId = AccountId.fromString(treasuryAccountId);
        const buyerId = AccountId.fromString(buyerAccountId);

        // 2. Construct the Atomic Swap
        const transaction = new TransferTransaction()
            // LEG A: Delivery (Equity from Treasury -> Buyer)
            // We use addApprovedTokenTransfer because we are spending the Allowance
            .addApprovedTokenTransfer(equityTokenId, issuerId, -amount)
            .addTokenTransfer(equityTokenId, buyerId, amount)

            // LEG B: Payment (Stablecoin from Buyer -> Treasury)
            // Standard transfer, requires Buyer's signature on frontend
            .addTokenTransfer(stableCoinId, buyerId, -totalPrice)
            .addTokenTransfer(stableCoinId, issuerId, totalPrice)

            // Freeze logic: We must freeze before signing
            .freezeWith(this.client);

        // 3. Backend signs with configured operator signer (AWS KMS-backed)
        const signedTx = await transaction.signWithOperator(this.client);

        // 4. Return serialized transaction to Frontend
        return {
            transactionBytes: Buffer.from(signedTx.toBytes()).toString('base64'),
            message: "Transaction created and signed by Broker. Waiting for Buyer signature."
        };
    }
}
