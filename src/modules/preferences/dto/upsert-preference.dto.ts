import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpsertPreferenceDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(80)
  minAge?: number;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(80)
  maxAge?: number;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  religiosityLevel?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  tribe?: string;
}




