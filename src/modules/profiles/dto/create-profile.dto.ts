import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsDateString,
  MinLength,
} from 'class-validator';

export class CreateProfileDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['male', 'female'], {
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
  maritalStatus: string;

  @IsString()
  @IsNotEmpty()
  education: string;

  @IsString()
  @IsNotEmpty()
  occupation: string;

  @IsString()
  @IsNotEmpty()
  religiosityLevel: string;

  @IsString()
  @MinLength(2)
  about?: string;
}

