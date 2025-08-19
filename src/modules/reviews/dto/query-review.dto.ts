import { IsOptional, IsEnum, IsMongoId, IsInt, Min, Max, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewType } from '../schemas/review.schema';

export class QueryReviewDto {
  @ApiPropertyOptional({ 
    description: 'Filter by reviewer ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  reviewer?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by reviewee ID',
    example: '507f1f77bcf86cd799439012'
  })
  @IsOptional()
  @IsMongoId()
  reviewee?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by project ID',
    example: '507f1f77bcf86cd799439013'
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by review type',
    enum: ReviewType,
    example: ReviewType.CLIENT_TO_FREELANCER
  })
  @IsOptional()
  @IsEnum(ReviewType)
  type?: ReviewType;

  @ApiPropertyOptional({ 
    description: 'Filter by minimum rating',
    minimum: 1,
    maximum: 5,
    example: 4
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by maximum rating',
    minimum: 1,
    maximum: 5,
    example: 5
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRating?: number;

  @ApiPropertyOptional({ 
    description: 'Search term for review title or comment',
    example: 'excellent work'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by public reviews only',
    default: true,
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Filter by verified reviews only',
    example: true
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isVerified?: boolean;

  @ApiPropertyOptional({ 
    description: 'Include reported reviews',
    default: false,
    example: false
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeReported?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    default: 1,
    minimum: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of reviews per page',
    default: 10,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    default: 'createdAt',
    example: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    example: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
