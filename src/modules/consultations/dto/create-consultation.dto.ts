import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ConsultationStatus } from '../schemas/consultation.schema';

export class CreateConsultationDto {
  @IsString()
  consultantId: string;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsEnum(ConsultationStatus)
  status?: ConsultationStatus;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
