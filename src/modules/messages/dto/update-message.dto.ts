import { IsOptional, IsString, IsEnum, IsBoolean, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MessageStatus } from '../schemas/message.schema';

export class UpdateMessageDto {
  @ApiPropertyOptional({ 
    description: 'Updated message content',
    example: 'Updated message content'
  })
  @IsOptional()
  @IsString()
  @MaxLength(10000, { message: 'Message content cannot exceed 10000 characters' })
  content?: string;

  @ApiPropertyOptional({ 
    description: 'Message status',
    enum: MessageStatus,
    example: MessageStatus.READ
  })
  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus;

  @ApiPropertyOptional({ 
    description: 'Whether message is edited',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isEdited?: boolean;

  @ApiPropertyOptional({ 
    description: 'Whether message is deleted by sender',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  deletedBySender?: boolean;

  @ApiPropertyOptional({ 
    description: 'Whether message is deleted by recipient',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  deletedByRecipient?: boolean;

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { edited: true, editedAt: '2023-12-01T10:00:00Z' }
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
