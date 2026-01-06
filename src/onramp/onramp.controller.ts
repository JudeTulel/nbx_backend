import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { OnrampService } from './onramp.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('onramp')
export class OnrampController {
  constructor(private readonly onrampService: OnrampService) { }

  /**
   * POST /onramp/initialize
   * Initialize a payment with Orion Ramp
   * Requires authentication
   * 
   * Example:
   * {
   *   "token": "KESy_TESTNET",
   *   "amount": 1000,
   *   "email": "user@example.com",
   *   "currency": "KES",
   *   "metadata": { "orderID": "unique-uuid" }
   * }
   */
  @UseGuards(JwtAuthGuard)
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initializePayment(
    @Body() dto: InitializePaymentDto,
    @Req() req: any,
  ) {
    const userEmail = req.user?.useremail;
    return await this.onrampService.initializePayment(dto, userEmail);
  }

  /**
   * POST /onramp/webhook
   * Handle webhook from Orion Ramp
   * Public endpoint - called by Orion Ramp when payment status changes
   * NO AUTHENTICATION - Orion Ramp cannot send JWT tokens
   * 
   * This endpoint receives payment status updates automatically:
   * - charge_success: Payment completed successfully
   * - charge_failed: Payment failed
   * - token_transfer_pending: Token transfer started
   * - token_transfer_success: Tokens transferred successfully
   * - token_transfer_failed: Token transfer failed
   * 
   * Example payload from Orion:
   * {
   *   "event_type": "charge_success",
   *   "order_id": "q1w2e3r4",
   *   "token": "KESy_TESTNET",
   *   "amount": 1000,
   *   "currency": "KES"
   * }
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Req() req: any,
  ) {
    const signature = req.headers['x-orion-signature'];
    return await this.onrampService.handleWebhook(payload, signature);
  }

  /**
   * GET /onramp/transactions
   * Get all transactions for the authenticated user
   * Requires authentication
   * 
   * Query params:
   * - limit: Number of records to return (default: 50, max: 100)
   * - skip: Number of records to skip for pagination (default: 0)
   * 
   * Example: GET /onramp/transactions?limit=10&skip=0
   */
  @UseGuards(JwtAuthGuard)
  @Get('transactions')
  async getUserTransactions(
    @Req() req: any,
    @Query('limit') limit?: string,
    @Query('skip') skip?: string,
  ) {
    const userEmail = req.user?.useremail;
    const limitNum = limit ? Math.min(parseInt(limit, 10), 100) : 50; // Max 100
    const skipNum = skip ? parseInt(skip, 10) : 0;

    return await this.onrampService.getUserPayments(userEmail, limitNum, skipNum);
  }

  /**
   * GET /onramp/transaction/reference/:reference
   * Get transaction details by reference ID
   * Requires authentication
   * 
   * Example: GET /onramp/transaction/reference/ref_abc123
   */
  @UseGuards(JwtAuthGuard)
  @Get('transaction/reference/:reference')
  async getTransactionByReference(
    @Param('reference') reference: string,
    @Req() req: any,
  ) {
    const userEmail = req.user?.useremail;
    return await this.onrampService.getPaymentByReference(reference, userEmail);
  }

  /**
   * GET /onramp/transaction/order/:orderID
   * Get transaction details by order ID
   * Requires authentication
   * 
   * Example: GET /onramp/transaction/order/550e8400-e29b-41d4-a716-446655440000
   */
  @UseGuards(JwtAuthGuard)
  @Get('transaction/order/:orderID')
  async getTransactionByOrderId(
    @Param('orderID') orderID: string,
    @Req() req: any,
  ) {
    const userEmail = req.user?.useremail;
    return await this.onrampService.getPaymentByOrderId(orderID, userEmail);
  }

  /**
   * GET /onramp/transaction/:reference/verify
   * Verify if a transaction is completed successfully
   * Requires authentication
   * 
   * Returns: { verified: true/false, status: "SUCCESS" | "NOT_COMPLETED" }
   * 
   * Example: GET /onramp/transaction/ref_abc123/verify
   */
  @UseGuards(JwtAuthGuard)
  @Get('transaction/:reference/verify')
  async verifyTransaction(
    @Param('reference') reference: string,
    @Req() req: any,
  ) {
    const userEmail = req.user?.useremail;
    const isVerified = await this.onrampService.verifyPayment(reference, userEmail);

    return {
      success: true,
      reference,
      verified: isVerified,
      status: isVerified ? 'SUCCESS' : 'NOT_COMPLETED',
    };
  }

  /**
   * GET /onramp/stats
   * Get payment statistics for the authenticated user
   * Requires authentication
   * 
   * Returns:
   * - Total payments
   * - Successful/pending/failed counts
   * - Total amount spent
   * - Success rate
   * - Recent payment activity
   * 
   * Example: GET /onramp/stats
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getUserStats(@Req() req: any) {
    const userEmail = req.user?.useremail;
    return await this.onrampService.getUserStats(userEmail);
  }

  /**
   * GET /onramp/health
   * Health check endpoint
   * Public endpoint - no authentication required
   * 
   * Returns: { status: "ok", service: "onramp", timestamp: "..." }
   * 
   * Example: GET /onramp/health
   */
  @Get('health')
  async healthCheck() {
    return {
      status: 'ok',
      service: 'onramp',
      timestamp: new Date().toISOString(),
    };
  }
}