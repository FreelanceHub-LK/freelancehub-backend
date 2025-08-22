import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsMongoId, 
  IsNumber, 
  IsPositive, 
  IsDateString, 
  IsOptional, 
  IsEnum,
  IsArray,
  MaxLength,
  Min,
  ValidateNested
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectStatus, BudgetType } from '../schemas/project.schema';

export class CreateProjectAttachmentDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({ description: 'MIME type' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsNumber()
  @Min(0)
  size: number;

  @ApiProperty({ description: 'File URL' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateProjectDto {
  @ApiProperty({ 
    description: 'Project title',
    example: 'E-commerce Website Development'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ 
    description: 'Detailed project description',
    example: 'Need a modern e-commerce platform with React frontend and Node.js backend'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  description: string;

  @ApiProperty({ description: 'Client ID creating the project' })
  @IsMongoId()
  client: string;

  @ApiProperty({ 
    description: 'Category ID for the project',
    example: 'web-development'
  })
  @IsMongoId()
  category: string;

  @ApiProperty({ 
    description: 'Required skills for the project',
    type: [String],
    required: false,
    example: ['react', 'nodejs', 'mongodb']
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  requiredSkills?: string[];

  @ApiProperty({ 
    description: 'Budget type',
    enum: BudgetType,
    example: BudgetType.FIXED
  })
  @IsEnum(BudgetType)
  budgetType: BudgetType;

  @ApiProperty({ 
    description: 'Project budget amount',
    example: 150000
  })
  @IsNumber()
  @IsPositive()
  budgetAmount: number;

  @ApiProperty({ 
    description: 'Currency code',
    example: 'LKR',
    default: 'LKR'
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ 
    description: 'Project deadline', 
    required: false,
    example: '2025-04-15T00:00:00Z'
  })
  @IsDateString()
  @IsOptional()
  deadline?: Date;

  @ApiProperty({ 
    description: 'Project status',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
    required: false
  })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @ApiProperty({ 
    description: 'Project attachments',
    type: [CreateProjectAttachmentDto],
    required: false 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProjectAttachmentDto)
  @IsOptional()
  attachments?: CreateProjectAttachmentDto[];
}
