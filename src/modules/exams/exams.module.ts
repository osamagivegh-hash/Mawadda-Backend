import { Module } from '@nestjs/common';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { ExamAccessGuard } from './guards/exam-access.guard';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  controllers: [ExamsController],
  providers: [ExamsService, ExamAccessGuard],
  exports: [ExamsService],
})
export class ExamsModule {}
