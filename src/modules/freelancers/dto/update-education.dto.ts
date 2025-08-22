import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateEducationDto {
  @ApiProperty({
    description: 'Education background',
    example: 'Bachelor of Science in Computer Science, University of California',
    maxLength: 500
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Education description cannot exceed 500 characters' })
  education: string;
}
