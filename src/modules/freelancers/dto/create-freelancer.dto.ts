import { IsString, IsNumber, IsBoolean, IsArray, IsOptional, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class CreateFreelancerDto {
  @ApiProperty({ description: 'User ID for the freelancer' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Array of skills', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Hourly rate in USD' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Education background' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Availability status', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Array of certifications', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Array of portfolio links', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  portfolioLinks?: string[];
}
