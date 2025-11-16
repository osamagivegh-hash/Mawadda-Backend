import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipService } from '../membership/membership.service';
import { ExamsService } from '../exams/exams.service';

export interface PaymentWebhookData {
  userId: string;
  type: 'membership' | 'exam';
  planId?: string;
  examId?: string;
  amount: number;
  currency: string;
  paymentId: string;
  status: 'success' | 'failed' | 'pending';
  signature?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly membershipService: MembershipService,
    private readonly examsService: ExamsService,
  ) {}

  /**
   * Verify payment webhook signature
   */
  private verifyWebhookSignature(payload: string, signature: string): boolean {
    const secretKey = this.configService.get<string>('PAYMENT_SECRET_KEY');
    if (!secretKey) {
      this.logger.error('PAYMENT_SECRET_KEY not configured');
      return false;
    }

    // In a real implementation, you would verify the signature using HMAC
    // This is a simplified example
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Process payment webhook from payment gateway
   */
  async processPaymentWebhook(
    payload: string, 
    signature: string, 
    webhookData: PaymentWebhookData
  ) {
    // Verify webhook signature for security
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Processing payment webhook for user ${webhookData.userId}, type: ${webhookData.type}`);

    if (webhookData.status !== 'success') {
      this.logger.warn(`Payment failed for user ${webhookData.userId}: ${webhookData.status}`);
      return { message: 'Payment not successful', status: webhookData.status };
    }

    try {
      if (webhookData.type === 'membership' && webhookData.planId) {
        // Complete membership upgrade
        const result = await this.membershipService.completeMembershipUpgrade(
          webhookData.userId,
          webhookData.planId,
          true // payment verified
        );
        
        this.logger.log(`Membership upgraded for user ${webhookData.userId} to plan ${webhookData.planId}`);
        return result;

      } else if (webhookData.type === 'exam' && webhookData.examId) {
        // Complete exam purchase
        const result = await this.examsService.completeExamPurchase(
          webhookData.userId,
          webhookData.examId,
          true // payment verified
        );
        
        this.logger.log(`Exam purchased for user ${webhookData.userId}: ${webhookData.examId}`);
        return result;

      } else {
        throw new BadRequestException('Invalid payment type or missing required data');
      }
    } catch (error) {
      this.logger.error(`Error processing payment webhook: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get payment status (for testing purposes)
   */
  async getPaymentStatus(paymentId: string) {
    // In a real implementation, you would query the payment gateway API
    return {
      paymentId,
      status: 'success', // Mock status
      message: 'Payment completed successfully',
    };
  }
}








