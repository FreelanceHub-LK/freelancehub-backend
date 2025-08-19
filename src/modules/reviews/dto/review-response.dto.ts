import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({ 
    description: 'Response comment',
    example: 'Thank you for the positive feedback! It was a pleasure working with you.'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  comment: string;
}
