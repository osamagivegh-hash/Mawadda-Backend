import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ConsultationStatus } from '../schemas/consultation.schema';

export class UpdateConsultationDto {
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

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
