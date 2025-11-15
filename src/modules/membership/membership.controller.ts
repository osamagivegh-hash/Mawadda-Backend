import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MembershipService } from './membership.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { SelectMembershipDto } from './dto/select-membership.dto';
import { UsersService } from '../users/users.service';

@Controller('membership')
@UseGuards(JwtAuthGuard)
export class MembershipController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly usersService: UsersService,
  ) {}

  @Get('plans')
  getPlans() {
    return this.membershipService.getPlans();
  }

  @Get()
  async getCurrentPlan(@Req() request: RequestWithUser) {
    const user = await this.usersService.findOne(request.user.id);
    const plans = this.membershipService.getPlans();
    const plan =
      plans.find((item) => item.id === user?.membershipPlanId) ?? plans[0];
    return {
      plan,
      membershipPlanId: user?.membershipPlanId,
      membershipExpiresAt: user?.membershipExpiresAt ?? null,
    };
  }

  @Post('select')
  selectPlan(
    @Req() request: RequestWithUser,
    @Body() selectMembershipDto: SelectMembershipDto,
  ) {
    // This now redirects to payment instead of directly upgrading
    return this.membershipService.initiateMembershipUpgrade(
      request.user.id,
      selectMembershipDto.planId,
    );
  }

  @Post('upgrade')
  upgradeMembership(
    @Req() request: RequestWithUser,
    @Body() selectMembershipDto: SelectMembershipDto,
  ) {
    return this.membershipService.initiateMembershipUpgrade(
      request.user.id,
      selectMembershipDto.planId,
    );
  }
}




