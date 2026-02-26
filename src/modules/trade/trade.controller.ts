import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { TradeService } from './trade.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@Controller('trade')
export class TradeController {
    constructor(private readonly tradeService: TradeService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create-swap')
    async createSwap(@Body() body: any) {
        const {
            buyerId,
            equityTokenId,
            stableCoinId,
            treasuryId,
            amount,
            price
        } = body;

        // Basic Validation
        if (!buyerId || !equityTokenId || !stableCoinId || !treasuryId || amount === undefined || price === undefined) {
            throw new BadRequestException("Missing required fields: buyerId, equityTokenId, stableCoinId, treasuryId, amount, price");
        }

        try {
            const result = await this.tradeService.createDvPTransaction(
                buyerId,
                equityTokenId,
                stableCoinId,
                treasuryId,
                Number(amount),
                Number(price)
            );
            return result;
        } catch (error: any) {
            throw new BadRequestException(error.message || "Failed to create swap transaction");
        }
    }
}
