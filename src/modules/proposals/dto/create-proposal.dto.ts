import { ApiProperty } from '@nestjs/swagger';
import { 
  IsString, 
  IsNotEmpty, 
  IsMongoId, 
  IsNumber, 
  IsPositive, 
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProposalMilestoneDto {
  @ApiProperty({ 
    description: 'Milestone title',
    example: 'UI/UX Design'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @ApiProperty({ 
    description: 'Milestone description',
    example: 'Complete design mockups and wireframes'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ 
    description: 'Milestone amount',
    example: 40000
  })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ 
    description: 'Milestone duration',
    example: '2 weeks'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  duration: string;
}

export class CreateProposalAttachmentDto {
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

export class CreateProposalDto {
  @ApiProperty({ description: 'Freelancer ID submitting the proposal' })
  @IsMongoId()
  freelancer: string;

  @ApiProperty({ description: 'Project ID for the proposal' })
  @IsMongoId()
  project: string;

  @ApiProperty({ 
    description: 'Cover letter or pitch',
    example: 'I have 5+ years experience in React development...'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  coverLetter: string;

  @ApiProperty({ 
    description: 'Proposed budget amount',
    example: 140000
  })
  @IsNumber()
  @IsPositive()
  proposedBudget: number;

  @ApiProperty({ 
    description: 'Delivery timeline description',
    example: '6 weeks'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  deliveryTimeline: string;

  @ApiProperty({ 
    description: 'Proposed milestones for the project',
    type: [CreateProposalMilestoneDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalMilestoneDto)
  @IsOptional()
  milestones?: CreateProposalMilestoneDto[];

  @ApiProperty({ 
    description: 'Portfolio items referenced in proposal',
    type: [String],
    required: false
  })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  portfolioItems?: string[];

  @ApiProperty({ 
    description: 'Proposal attachments',
    type: [CreateProposalAttachmentDto],
    required: false
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProposalAttachmentDto)
  @IsOptional()
  attachments?: CreateProposalAttachmentDto[];
}