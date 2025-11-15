import { 
  Controller, 
  Get, 
  Post, 
  Param, 
  Body, 
  UseGuards, 
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExamAccessGuard } from './guards/exam-access.guard';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';
import { ExamsService } from './exams.service';
import { SubmitExamDto } from './dto/submit-exam.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  /**
   * Get all available exams (public preview)
   */
  @Get()
  getAvailableExams() {
    return this.examsService.getAvailableExams();
  }

  /**
   * Get exam preview (without questions)
   */
  @Get(':examId/preview')
  getExamPreview(@Param('examId') examId: string) {
    return this.examsService.getExamPreview(examId);
  }

  /**
   * Purchase exam - redirects to payment
   */
  @Post(':examId/purchase')
  purchaseExam(
    @Req() request: RequestWithUser,
    @Param('examId') examId: string,
  ) {
    return this.examsService.initiateExamPurchase(request.user.id, examId);
  }

  /**
   * Get user's purchased exams
   */
  @Get('my-exams')
  getUserPurchasedExams(@Req() request: RequestWithUser) {
    return this.examsService.getUserPurchasedExams(request.user.id);
  }

  /**
   * Get full exam content - requires purchase
   */
  @Get(':examId')
  @UseGuards(ExamAccessGuard)
  getExamContent(
    @Req() request: RequestWithUser,
    @Param('examId') examId: string,
  ) {
    return this.examsService.getExamContent(request.user.id, examId);
  }

  /**
   * Submit exam answers - requires purchase
   */
  @Post(':examId/submit')
  @UseGuards(ExamAccessGuard)
  submitExam(
    @Req() request: RequestWithUser,
    @Param('examId') examId: string,
    @Body() submitExamDto: SubmitExamDto,
  ) {
    return this.examsService.submitExam(
      request.user.id, 
      examId, 
      submitExamDto.answers
    );
  }
}






