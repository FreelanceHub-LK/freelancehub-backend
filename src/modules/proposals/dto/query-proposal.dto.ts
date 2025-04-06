import { ApiProperty } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsEnum, 
  IsMongoId, 
  IsNumber,
  Min,
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProposalStatus } from '../schemas/proposal.schema';

export class QueryProposalDto {
  @ApiProperty({ 
    description: 'Filter by proposal status',
    enum: ProposalStatus,
    required: false
  })
  @IsEnum(ProposalStatus)
  @IsOptional()
  status?: ProposalStatus;

  @ApiProperty({ 
    description: 'Filter by freelancer ID',
    required: false
  })
  @IsMongoId()
  @IsOptional()
  freelancer?: string;

  @ApiProperty({ 
    description: 'Filter by project ID',
    required: false
  })
  @IsMongoId()
  @IsOptional()
  project?: string;

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
    enum: ['createdAt', 'bidAmount', 'estimatedDays'],
    default: 'createdAt',
    required: false
  })
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc',
    required: false
  })
  @IsOptional()
  sortOrder?: string = 'desc';
}
