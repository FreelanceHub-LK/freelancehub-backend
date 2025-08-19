import { IsString, IsOptional, IsMongoId, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({ 
    description: 'Participant user IDs (must be exactly 2)',
    example: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012']
  })
  @IsArray()
  @IsMongoId({ each: true })
  participants: string[];

  @ApiPropertyOptional({ 
    description: 'Project ID if conversation is related to a project',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({ 
    description: 'Contract ID if conversation is related to a contract',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  contract?: string;

  @ApiPropertyOptional({ 
    description: 'Conversation subject/title',
    example: 'Project Discussion'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Subject cannot exceed 255 characters' })
  subject?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { category: 'project-inquiry' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
