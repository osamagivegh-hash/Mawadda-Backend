import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { addDays } from 'date-fns';
import { MembershipPlan, MEMBERSHIP_PLANS } from './membership.constants';
import { UsersService } from '../users/users.service';

@Injectable()
export class MembershipService {
  private readonly plans = MEMBERSHIP_PLANS;

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  getPlans(): MembershipPlan[] {
    return this.plans;
  }

  getPlan(planId: string): MembershipPlan {
    const plan = this.plans.find((item) => item.id === planId);
    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }
    return plan;
  }

  /**
   * Initiates membership upgrade process - requires payment completion
   * Returns payment URL for user to complete payment
   */
  async initiateMembershipUpgrade(userId: string, planId: string) {
    const plan = this.getPlan(planId);
    const user = await this.usersService.findOne(userId);
    
    // Check if user already has this plan or higher
    if (user?.membershipPlanId === planId) {
      throw new BadRequestException('You already have this membership plan');
    }

    // Get payment URL from environment variables
    const paymentUrl = this.configService.get<string>('MEMBERSHIP_PAYMENT_URL');
    if (!paymentUrl) {
      throw new BadRequestException('Payment system is currently unavailable');
    }

    // Store pending upgrade in user record for verification after payment
    await this.usersService.setPendingMembershipUpgrade(userId, planId);

    return {
      message: 'You must complete the upgrade payment before your membership can be activated.',
      paymentUrl: `${paymentUrl}?userId=${userId}&planId=${planId}&type=membership`,
      plan,
    };
  }

  /**
   * Completes membership upgrade after successful payment verification
   * This should only be called from payment webhook/callback
   */
  async completeMembershipUpgrade(userId: string, planId: string, paymentVerified: boolean) {
    if (!paymentVerified) {
      throw new BadRequestException('Payment verification failed');
    }

    const plan = this.getPlan(planId);
    const expiresAt =
      plan.durationDays && plan.durationDays > 0
        ? addDays(new Date(), plan.durationDays)
        : null;

    // Update user membership and clear pending upgrade
    await this.usersService.updateMembership(userId, plan.id, expiresAt);
    await this.usersService.clearPendingMembershipUpgrade(userId);

    return {
      message: 'Membership upgraded successfully',
      plan,
      expiresAt,
    };
  }

  /**
   * Legacy method - kept for backward compatibility but now requires payment
   */
  async selectPlan(userId: string, planId: string) {
    // Redirect to payment flow instead of direct upgrade
    return this.initiateMembershipUpgrade(userId, planId);
  }
}
