import { IsOptional, IsString, IsEnum, IsMongoId, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageType, MessageStatus } from '../schemas/message.schema';

export class QueryMessageDto {
  @ApiPropertyOptional({ 
    description: 'Conversation participant user ID',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  participant?: string;

  @ApiPropertyOptional({ 
    description: 'Project ID to filter messages by project',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  project?: string;

  @ApiPropertyOptional({ 
    description: 'Contract ID to filter messages by contract',
    example: '507f1f77bcf86cd799439011'
  })
  @IsOptional()
  @IsMongoId()
  contract?: string;

  @ApiPropertyOptional({ 
    description: 'Message type filter',
    enum: MessageType,
    example: MessageType.TEXT
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @ApiPropertyOptional({ 
    description: 'Message status filter',
    enum: MessageStatus,
    example: MessageStatus.READ
  })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({ 
    description: 'Search term for message content',
    example: 'project requirements'
  })
  @IsOptional()
  @IsString()
  search?: string;

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
    description: 'Number of messages per page',
    default: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

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

  @ApiPropertyOptional({ 
    description: 'Include deleted messages',
    default: false,
    example: false
  })
  @IsOptional()
  includeDeleted?: boolean = false;
}
