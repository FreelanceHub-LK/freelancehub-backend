import { IsString, IsNotEmpty, IsOptional, IsEnum, IsMongoId, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType } from '../schemas/message.schema';

export class AttachmentDto {
  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({ description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  originalName: string;

  @ApiProperty({ description: 'File MIME type' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @IsOptional()
  size?: number;

  @ApiProperty({ description: 'File URL' })
  @IsString()
  @IsNotEmpty()
  url: string;
}

export class CreateMessageDto {
  @ApiProperty({ 
    description: 'Recipient user ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsMongoId()
  @IsNotEmpty()
  recipient: string;

  @ApiPropertyOptional({ 
    description: 'Project ID if message is related to a project',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({ 
    description: 'Contract ID if message is related to a contract',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  contract?: string;

  @ApiProperty({ 
    description: 'Message content',
    example: 'Hello, I would like to discuss the project requirements.'
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Message content cannot exceed 10000 characters' })
  content: string;

  @ApiPropertyOptional({ 
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT,
    example: MessageType.TEXT
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ 
    description: 'File attachments',
    type: [AttachmentDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttachmentDto)
  attachments?: AttachmentDto[];

  @ApiPropertyOptional({ 
    description: 'Message this is replying to',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  replyTo?: string;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { priority: 'high' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
