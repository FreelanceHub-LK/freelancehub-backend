import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsMongoId, 
  IsNumber, 
  IsBoolean,
  IsArray,
  ValidateNested,
  MaxLength,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewType } from '../schemas/review.schema';

export class DetailedRatingsDto {
  @ApiProperty({ 
    description: 'Communication rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  communication: number;

  @ApiProperty({ 
    description: 'Quality rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  quality: number;

  @ApiProperty({ 
    description: 'Timeliness rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  timeliness: number;

  @ApiProperty({ 
    description: 'Professionalism rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  professionalism: number;

  @ApiProperty({ 
    description: 'Value rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  value: number;
}

export class CreateReviewDto {
  @ApiProperty({ 
    description: 'User who will receive the review',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  reviewee: string;

  @ApiProperty({ 
    description: 'Project ID this review is for',
    example: '507f1f77bcf86cd799439012'
  })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiPropertyOptional({ 
    description: 'Contract ID this review is for',
    example: '507f1f77bcf86cd799439013'
  })
  @IsOptional()
  @IsMongoId()
  contract?: string;

  @ApiProperty({ 
    description: 'Type of review',
    enum: ReviewType,
    example: ReviewType.CLIENT_TO_FREELANCER
  })
  @IsEnum(ReviewType)
  type: ReviewType;

  @ApiProperty({ 
    description: 'Overall rating (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ 
    description: 'Review title',
    example: 'Excellent work on the website project'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ 
    description: 'Review comment',
    example: 'The freelancer delivered high-quality work on time and was very professional throughout the project.'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comment: string;

  @ApiPropertyOptional({ 
    description: 'Detailed ratings breakdown',
    type: DetailedRatingsDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DetailedRatingsDto)
  detailedRatings?: DetailedRatingsDto;

  @ApiPropertyOptional({ 
    description: 'Skills demonstrated (for freelancer reviews)',
    example: ['507f1f77bcf86cd799439014', '507f1f77bcf86cd799439015']
  })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ 
    description: 'Whether this review should be public',
    default: true,
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { projectCategory: 'web-development' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
