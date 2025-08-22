import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty, ArrayUnique } from 'class-validator';

export class UpdateSkillsDto {
  @ApiProperty({
    description: 'Array of skills',
    example: ['JavaScript', 'React', 'Node.js'],
    type: [String]
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  @ArrayUnique()
  skills: string[];
}
