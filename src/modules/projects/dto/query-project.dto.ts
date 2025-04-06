import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsEnum, 
  IsMongoId, 
  IsString,
  IsNumber,
  Min,
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus } from '../schemas/project.schema';

export class QueryProjectDto {
  @ApiProperty({ 
    description: 'Filter by project status',
    enum: ProjectStatus,
    required: false
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ 
    description: 'Filter by client ID',
    required: false
  })
  @IsMongoId()
  @IsOptional()
  client?: string;

  @ApiProperty({ 
    description: 'Filter by category ID',
    required: false
  })
  @IsMongoId()
  @IsOptional()
  category?: string;

  @ApiProperty({ 
    description: 'Search in title and description',
    required: false
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ 
    description: 'Minimum budget',
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minBudget?: number;

  @ApiProperty({ 
    description: 'Maximum budget',
    required: false
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  maxBudget?: number;

  @ApiProperty({ 
    description: 'Required skill ID',
    required: false
  })
  @IsMongoId()
  @IsOptional()
  skill?: string;

  @ApiProperty({ 
    description: 'Page number',
    minimum: 1,
    default: 1,
    required: false
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Items per page',
    minimum: 1,
    maximum: 50,
    default: 10,
    required: false
  })
  @IsNumber()
  @Min(1)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ 
    description: 'Sort by field',
    enum: ['createdAt', 'budget', 'deadline'],
    default: 'createdAt',
    required: false
  })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false
  })
  @IsString()
  @IsOptional()
  sortOrder?: string = 'desc';
}