import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'React' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'A JavaScript library for building user interfaces' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '64f5a7b2c3d4e5f6a7b8c9d0' })
  @IsMongoId()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  popularity?: number;
}

