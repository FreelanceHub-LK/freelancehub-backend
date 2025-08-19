import { IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class RespondToReviewDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000, {
    message: 'Response must not be longer than 2000 characters',
  })
  response: string;
}
