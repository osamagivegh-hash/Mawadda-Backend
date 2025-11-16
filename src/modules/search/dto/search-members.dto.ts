import { Transform } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { UserRole } from '../../users/schemas/user.schema';

export class SearchMembersDto {
  // MANDATORY: Gender is required for search
  @IsString()
  gender: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  // MANDATORY: At least one age value (minAge or maxAge) is required
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(18)
  @Max(80)
  minAge?: number;

  // MANDATORY: At least one age value (minAge or maxAge) is required
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(18)
  @Max(80)
  maxAge?: number;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @IsString()
  occupation?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(100)
  @Max(250)
  height?: number;

  @IsOptional()
  @IsString()
  countryOfResidence?: string;

  @IsOptional()
  @IsString()
  marriageType?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  religiosityLevel?: string;

  @IsOptional()
  @IsString()
  polygamyAcceptance?: string;

  @IsOptional()
  @IsString()
  compatibilityTest?: string;

  @IsOptional()
  @IsBooleanString()
  hasPhoto?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}




