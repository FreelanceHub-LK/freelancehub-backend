import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @ApiPropertyOptional({ 
    description: 'Whether this review has been reported',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  isReported?: boolean;
}
