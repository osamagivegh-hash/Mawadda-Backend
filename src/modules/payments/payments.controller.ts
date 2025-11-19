import { 
  Controller, 
  Post, 
  Body, 
  Headers, 
  Get, 
  Param,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PaymentsService, PaymentWebhookData } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Payment webhook endpoint - called by payment gateway after payment completion
   * This endpoint should be publicly accessible (no auth guard)
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handlePaymentWebhook(
    @Body() webhookData: PaymentWebhookData,
    @Headers('x-webhook-signature') signature: string,
  ) {
    this.logger.log(`Received payment webhook for user ${webhookData.userId}`);
    
    // Convert body to string for signature verification
    const payload = JSON.stringify(webhookData);
    
    return this.paymentsService.processPaymentWebhook(payload, signature, webhookData);
  }

  /**
   * Get payment status - for testing/debugging
   */
  @Get('status/:paymentId')
  getPaymentStatus(@Param('paymentId') paymentId: string) {
    return this.paymentsService.getPaymentStatus(paymentId);
  }

  /**
   * Test webhook endpoint - for development/testing only
   * Remove this in production
   */
  @Post('test-webhook')
  @HttpCode(HttpStatus.OK)
  async testWebhook(@Body() testData: any) {
    this.logger.log('Test webhook received:', testData);
    
    // Mock webhook data for testing
    const mockWebhookData: PaymentWebhookData = {
      userId: testData.userId,
      type: testData.type,
      planId: testData.planId,
      examId: testData.examId,
      amount: testData.amount || 100,
      currency: 'SAR',
      paymentId: `test_${Date.now()}`,
      status: 'success',
    };

    // Use a test signature
    const testSignature = 'test_signature';
    const payload = JSON.stringify(mockWebhookData);

    return this.paymentsService.processPaymentWebhook(payload, testSignature, mockWebhookData);
  }
}














