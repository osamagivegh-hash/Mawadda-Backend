import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { RequestWithUser } from '../../auth/interfaces/request-with-user.interface';

/**
 * Guard that ensures user has purchased the exam before accessing it
 */
@Injectable()
export class ExamAccessGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const userId = request.user?.id;
    const examId = request.params?.examId;

    if (!userId || !examId) {
      throw new ForbiddenException('Access denied');
    }

    // Check if user has purchased this exam
    const hasAccess = await this.usersService.hasExamAccess(userId, examId);
    
    if (!hasAccess) {
      throw new ForbiddenException('You must purchase this exam before accessing it.');
    }

    return true;
  }
}














