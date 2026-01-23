import { TradeService } from './trade.service';
export declare class TradeController {
    private readonly tradeService;
    constructor(tradeService: TradeService);
    createSwap(body: any): Promise<{
        transactionBytes: string;
        message: string;
    }>;
}
