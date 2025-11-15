import { Module, forwardRef } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ProfilesModule } from '../profiles/profiles.module';
import { MatchesModule } from '../matches/matches.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { MembershipModule } from '../membership/membership.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    forwardRef(() => ProfilesModule),
    forwardRef(() => MatchesModule),
    forwardRef(() => ConsultationsModule),
    forwardRef(() => FavoritesModule),
    forwardRef(() => MembershipModule),
    forwardRef(() => UsersModule),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
  exports: [DashboardService],
})
export class DashboardModule {}




