import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { MatchStatus } from '../schemas/match.schema';

export class CreateMatchDto {
  @IsString()
  targetUserId: string;

  @IsOptional()
  @IsNumber()
  compatibilityScore?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}
