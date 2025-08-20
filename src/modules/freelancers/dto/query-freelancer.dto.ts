import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryFreelancerDto {
  @ApiPropertyOptional({ description: 'Filter by skills (comma-separated)' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ description: 'Minimum hourly rate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRate?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly rate' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxRate?: number;

  @ApiPropertyOptional({ description: 'Filter by availability status' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Search by location/education' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['createdAt', 'hourlyRate', 'completedProjects'] })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
