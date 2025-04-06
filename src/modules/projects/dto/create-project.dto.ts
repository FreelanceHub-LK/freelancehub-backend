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
  IsArray
} from 'class-validator';
import { ProjectStatus } from '../schemas/project.schema';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed project description' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Client ID creating the project' })
  @IsMongoId()
  client: string;

  @ApiProperty({ description: 'Category ID for the project' })
  @IsMongoId()
  category: string;

  @ApiProperty({ 
    description: 'Required skills for the project',
    type: [String],
    required: false
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  requiredSkills?: string[];

  @ApiProperty({ description: 'Project budget in LKR' })
  @IsNumber()
  @IsPositive()
  budget: number;

  @ApiProperty({ 
    description: 'Project deadline', 
    required: false 
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
    description: 'Project attachments URLs',
    type: [String],
    required: false 
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}
