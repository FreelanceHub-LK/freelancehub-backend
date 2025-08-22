import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayUnique } from 'class-validator';

export class UpdateCertificationsDto {
  @ApiProperty({
    description: 'Array of certifications',
    example: ['AWS Certified Developer', 'Microsoft Azure Fundamentals', 'Google Cloud Professional'],
    type: [String]
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayUnique()
  certifications: string[];
}
