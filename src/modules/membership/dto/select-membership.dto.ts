import { IsString } from 'class-validator';

export class SelectMembershipDto {
  @IsString()
  planId: string;
}




