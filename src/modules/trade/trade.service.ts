import { Injectable } from '@nestjs/common';
import {
    Client,
    TransferTransaction,
    AccountId,
    PrivateKey,
    TokenId
} from '@hashgraph/sdk';

@Injectable()
export class TradeService {
    private client: Client;
    private backendOperatorId: AccountId;
    private backendOperatorKey: PrivateKey;

    constructor() {
        // 1. Initialize Client with Backend Credentials (The "Spender")

        const operatorIdStr = process.env.OPERATOR_ID;
        const operatorKeyStr = process.env.OPERATOR_KEY;

        if (!operatorIdStr || !operatorKeyStr) {
            console.warn("OPERATOR_ID or OPERATOR_KEY not set in environment variables. TradeService will fail to initialize properly.");
            return;
        }

        this.backendOperatorId = AccountId.fromString(operatorIdStr);
        this.backendOperatorKey = PrivateKey.fromString(operatorKeyStr);

        // Using testnet by default as per instructions
        this.client = Client.forTestnet();
        this.client.setOperator(this.backendOperatorId, this.backendOperatorKey);
    }

    async createDvPTransaction(
        buyerAccountId: string,
        equityTokenIdStr: string,
        stableCoinIdStr: string,
        treasuryAccountId: string,
        amount: number,
        totalPrice: number
    ) {
        if (!this.client) {
            throw new Error("Hedera Client not initialized. Check OPERATOR_ID and OPERATOR_KEY env vars.");
        }

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

        // 3. Backend Signs (Authorizing the "Approved" Equity Transfer)
        // This signature validates the allowance usage
        const signedTx = await transaction.sign(this.backendOperatorKey);

        // 4. Return serialized transaction to Frontend
        return {
            transactionBytes: Buffer.from(signedTx.toBytes()).toString('base64'),
            message: "Transaction created and signed by Broker. Waiting for Buyer signature."
        };
    }
}
