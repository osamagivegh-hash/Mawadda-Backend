import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MembershipModule } from '../membership/membership.module';
import { ExamsModule } from '../exams/exams.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [MembershipModule, ExamsModule, UsersModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}











