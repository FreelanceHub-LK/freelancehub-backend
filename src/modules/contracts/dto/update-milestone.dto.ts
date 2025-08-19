import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  ValidateNested,
  MaxLength
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus } from '../schemas/contract.schema';

export class AttachmentDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  filename: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  originalName: string;

  @ApiProperty({ description: 'File MIME type' })
  @IsString()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsOptional()
  size?: number;

  @ApiProperty({ description: 'File URL' })
  @IsString()
  url: string;
}

export class UpdateMilestoneDto {
  @ApiPropertyOptional({ 
    description: 'Milestone status',
    enum: MilestoneStatus,
    example: MilestoneStatus.SUBMITTED
  })
  @IsOptional()
  @IsEnum(MilestoneStatus)
  status?: MilestoneStatus;

  @ApiPropertyOptional({ 
    description: 'Feedback for the milestone',
    example: 'Great work! Minor revisions needed on the color scheme.'
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  feedback?: string;

  @ApiPropertyOptional({ 
    description: 'Milestone attachments',
    type: [AttachmentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];
}
