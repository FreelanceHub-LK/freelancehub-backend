import { IsOptional, IsEnum, IsMongoId, IsInt, Min, Max, IsString, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ContractStatus, ContractType } from '../schemas/contract.schema';

export class QueryContractDto {
  @ApiPropertyOptional({ 
    description: 'Filter by project ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by client ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  client?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by freelancer ID',
    example: '507f1f77bcf86cd799439012'
  })
  @IsOptional()
  @IsMongoId()
  freelancer?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by contract status',
    enum: ContractStatus,
    example: ContractStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by contract type',
    enum: ContractType,
    example: ContractType.FIXED_PRICE
  })
  @IsOptional()
  @IsEnum(ContractType)
  type?: ContractType;

  @ApiPropertyOptional({ 
    description: 'Search term for contract title or description',
    example: 'web development'
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by start date (from)',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateFrom?: Date;

  @ApiPropertyOptional({ 
    description: 'Filter by start date (to)',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDateTo?: Date;

  @ApiPropertyOptional({ 
    description: 'Filter by end date (from)',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDateFrom?: Date;

  @ApiPropertyOptional({ 
    description: 'Filter by end date (to)',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDateTo?: Date;

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
    description: 'Number of contracts per page',
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
