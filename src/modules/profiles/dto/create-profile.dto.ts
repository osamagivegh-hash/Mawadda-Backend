import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsDateString,
  MinLength,
} from 'class-validator';
import {
  GENDERS,
  RELIGIOSITY_LEVELS,
  MARITAL_STATUSES,
  RELIGIONS,
} from '../profile-options';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(GENDERS, {
    message: 'gender must be either "male" or "female"',
  })
  gender: string;

  @IsDateString(
    {},
    { message: 'dateOfBirth must be a valid ISO date string' },
  )
  @IsNotEmpty()
  dateOfBirth: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  nationality: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(MARITAL_STATUSES, {
    message: 'maritalStatus must be one of the predefined values',
  })
  maritalStatus: string;

  @IsString()
  @IsNotEmpty()
  education: string;

  @IsString()
  @IsNotEmpty()
  occupation: string;

  @IsString()
  @IsIn(RELIGIOSITY_LEVELS, {
    message: 'religiosityLevel must be one of the predefined values',
  })
  religiosityLevel: string;

  @IsString()
  @IsIn(RELIGIONS, {
    message: 'religion must be one of the predefined values',
  })
  religion?: string;

  @IsString()
  @MinLength(2)
  about?: string;
}

