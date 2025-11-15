import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface Exam {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  duration: number; // in minutes
  questions: ExamQuestion[];
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

// Mock exam data - in real app, this would come from database
const MOCK_EXAMS: Exam[] = [
  {
    id: 'compatibility-test',
    title: 'اختبار التوافق الشامل',
    description: 'اختبار شامل لتحديد مستوى التوافق مع الشريك المحتمل',
    price: 50,
    currency: 'SAR',
    duration: 30,
    questions: [
      {
        id: 'q1',
        question: 'ما هو أهم شيء في العلاقة الزوجية؟',
        options: ['التفاهم', 'الحب', 'الاحترام', 'التواصل'],
        correctAnswer: 3,
      },
      // Add more questions as needed
    ],
  },
  {
    id: 'personality-assessment',
    title: 'تقييم الشخصية',
    description: 'تحليل شامل لشخصيتك ونقاط القوة والضعف',
    price: 75,
    currency: 'SAR',
    duration: 45,
    questions: [
      {
        id: 'p1',
        question: 'كيف تتعامل مع المواقف الصعبة؟',
        options: ['بهدوء', 'بانفعال', 'بتجاهل', 'بطلب المساعدة'],
        correctAnswer: 0,
      },
      // Add more questions as needed
    ],
  },
];

@Injectable()
export class ExamsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get all available exams (public information)
   */
  getAvailableExams(): Omit<Exam, 'questions'>[] {
    return MOCK_EXAMS.map(({ questions, ...exam }) => exam);
  }

  /**
   * Get exam details without questions (for preview)
   */
  getExamPreview(examId: string): Omit<Exam, 'questions'> {
    const exam = MOCK_EXAMS.find(e => e.id === examId);
    if (!exam) {
      throw new BadRequestException('Exam not found');
    }

    const { questions, ...preview } = exam;
    return preview;
  }

  /**
   * Initiate exam purchase - requires payment completion
   */
  async initiateExamPurchase(userId: string, examId: string) {
    const exam = MOCK_EXAMS.find(e => e.id === examId);
    if (!exam) {
      throw new BadRequestException('Exam not found');
    }

    // Check if user already purchased this exam
    const hasAccess = await this.usersService.hasExamAccess(userId, examId);
    if (hasAccess) {
      throw new BadRequestException('You have already purchased this exam');
    }

    // Get payment URL from environment variables
    const paymentUrl = this.configService.get<string>('EXAM_PAYMENT_URL');
    if (!paymentUrl) {
      throw new BadRequestException('Payment system is currently unavailable');
    }

    const { questions, ...examPreview } = exam;

    return {
      message: 'You must purchase this exam before accessing it.',
      paymentUrl: `${paymentUrl}?userId=${userId}&examId=${examId}&type=exam&amount=${exam.price}`,
      exam: examPreview,
    };
  }

  /**
   * Complete exam purchase after successful payment verification
   */
  async completeExamPurchase(userId: string, examId: string, paymentVerified: boolean) {
    if (!paymentVerified) {
      throw new BadRequestException('Payment verification failed');
    }

    const exam = MOCK_EXAMS.find(e => e.id === examId);
    if (!exam) {
      throw new BadRequestException('Exam not found');
    }

    // Update user's purchased exams
    await this.usersService.setExamPurchased(userId, examId);

    return {
      message: 'Exam purchased successfully. You can now access it.',
      examId,
      title: exam.title,
    };
  }

  /**
   * Get full exam with questions - requires purchase verification
   */
  async getExamContent(userId: string, examId: string): Promise<Exam> {
    const exam = MOCK_EXAMS.find(e => e.id === examId);
    if (!exam) {
      throw new BadRequestException('Exam not found');
    }

    // Check if user has purchased this exam
    const hasAccess = await this.usersService.hasExamAccess(userId, examId);
    if (!hasAccess) {
      throw new ForbiddenException('You must purchase this exam before accessing it.');
    }

    return exam;
  }

  /**
   * Submit exam answers and get results
   */
  async submitExam(userId: string, examId: string, answers: Record<string, number>) {
    const exam = await this.getExamContent(userId, examId); // This checks access automatically

    let correctAnswers = 0;
    const totalQuestions = exam.questions.length;

    // Calculate score
    exam.questions.forEach(question => {
      const userAnswer = answers[question.id];
      if (userAnswer === question.correctAnswer) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    return {
      examId,
      title: exam.title,
      score,
      correctAnswers,
      totalQuestions,
      passed: score >= 70, // 70% passing grade
      completedAt: new Date(),
    };
  }

  /**
   * Get user's purchased exams
   */
  async getUserPurchasedExams(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user?.purchasedExams) {
      return [];
    }

    return MOCK_EXAMS
      .filter(exam => user.purchasedExams!.includes(exam.id))
      .map(({ questions, ...exam }) => exam);
  }
}






