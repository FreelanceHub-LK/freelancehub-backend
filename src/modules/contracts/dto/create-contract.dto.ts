import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsEnum, 
  IsMongoId, 
  IsNumber, 
  IsDate, 
  IsArray, 
  ValidateNested,
  MaxLength,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContractType } from '../schemas/contract.schema';

export class CreateMilestoneDto {
  @ApiProperty({ 
    description: 'Milestone title',
    example: 'Design Phase'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ 
    description: 'Milestone description',
    example: 'Complete the initial design mockups and wireframes'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ 
    description: 'Milestone amount in cents',
    example: 50000
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ 
    description: 'Milestone due date',
    example: '2024-01-15T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  dueDate: Date;

  @ApiPropertyOptional({ 
    description: 'List of deliverables for this milestone',
    example: ['Wireframes', 'Design mockups', 'Style guide']
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deliverables?: string[];
}

export class CreateContractDto {
  @ApiProperty({ 
    description: 'Contract title',
    example: 'Website Development Contract'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ 
    description: 'Contract description',
    example: 'Full-stack web development for e-commerce platform'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description: string;

  @ApiProperty({ 
    description: 'Project ID this contract is for',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  project: string;

  @ApiProperty({ 
    description: 'Freelancer ID assigned to the contract',
    example: '507f1f77bcf86cd799439012'
  })
  @IsMongoId()
  @IsNotEmpty()
  freelancer: string;

  @ApiProperty({ 
    description: 'Contract type',
    enum: ContractType,
    example: ContractType.FIXED_PRICE
  })
  @IsEnum(ContractType)
  type: ContractType;

  @ApiProperty({ 
    description: 'Contract total amount in cents',
    example: 250000
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ 
    description: 'Currency code',
    default: 'USD',
    example: 'USD'
  })
  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @ApiPropertyOptional({ 
    description: 'Hourly rate in cents (for hourly contracts)',
    example: 5000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ 
    description: 'Estimated hours (for hourly contracts)',
    example: 40
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedHours?: number;

  @ApiProperty({ 
    description: 'Contract start date',
    example: '2024-01-01T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @ApiProperty({ 
    description: 'Contract end date',
    example: '2024-03-01T00:00:00Z'
  })
  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @ApiPropertyOptional({ 
    description: 'Contract milestones',
    type: [CreateMilestoneDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMilestoneDto)
  milestones?: CreateMilestoneDto[];

  @ApiPropertyOptional({ 
    description: 'Contract terms and conditions',
    example: 'Payment will be made upon completion of each milestone...'
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  terms?: string;

  @ApiPropertyOptional({ 
    description: 'Contract scope of work',
    example: 'Development of responsive web application with admin panel...'
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  scope?: string;

  @ApiPropertyOptional({ 
    description: 'Payment terms',
    example: 'Net 30 days payment terms'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  paymentTerms?: string;

  @ApiPropertyOptional({ 
    description: 'Platform fee percentage',
    default: 5,
    minimum: 0,
    maximum: 100,
    example: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  platformFee?: number = 5;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { priority: 'high', category: 'web-development' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
