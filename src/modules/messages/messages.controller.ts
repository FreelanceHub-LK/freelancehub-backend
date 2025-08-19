import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  UseInterceptors,
  ClassSerializerInterceptor,
  Logger,
  Request,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import {
  CreateMessageDto,
  UpdateMessageDto,
  QueryMessageDto,
  CreateConversationDto,
} from './dto';
import { Message } from './schemas/message.schema';
import { Conversation } from './schemas/conversation.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class MessagesController {
  private readonly logger = new Logger(MessagesController.name);

  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ 
    status: 201, 
    description: 'Message sent successfully',
    type: Message
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: any,
  ): Promise<Message> {
    return this.messagesService.createMessage(createMessageDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Messages retrieved successfully',
    type: [Message]
  })
  @ApiQuery({ name: 'participant', required: false, description: 'Filter by conversation participant' })
  @ApiQuery({ name: 'project', required: false, description: 'Filter by project ID' })
  @ApiQuery({ name: 'contract', required: false, description: 'Filter by contract ID' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by message type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by message status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in message content' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findMessages(
    @Query() query: QueryMessageDto,
    @Request() req: any,
  ) {
    return this.messagesService.findMessages(query, req.user.id);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread message count for current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Unread count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number' }
      }
    }
  })
  async getUnreadCount(@Request() req: any) {
    const count = await this.messagesService.getUnreadCount(req.user.id);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific message by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Message retrieved successfully',
    type: Message
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Message not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to this message' 
  })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async findMessage(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<Message> {
    return this.messagesService.findMessageById(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a message' })
  @ApiResponse({ 
    status: 200, 
    description: 'Message updated successfully',
    type: Message
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Message not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to update this message' 
  })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async updateMessage(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req: any,
  ): Promise<Message> {
    return this.messagesService.updateMessage(id, updateMessageDto, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  @ApiResponse({ 
    status: 204, 
    description: 'Message deleted successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Message not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Access denied to delete this message' 
  })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async deleteMessage(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.messagesService.deleteMessage(id, req.user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark a message as read' })
  @ApiResponse({ 
    status: 204, 
    description: 'Message marked as read successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Message not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Only recipient can mark message as read' 
  })
  @ApiParam({ name: 'id', description: 'Message ID' })
  async markAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<void> {
    return this.messagesService.markAsRead(id, req.user.id);
  }

  // Conversation endpoints
  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({ 
    status: 201, 
    description: 'Conversation created successfully',
    type: Conversation
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation failed' 
  })
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
  ): Promise<Conversation> {
    return this.messagesService.createConversation(createConversationDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations for current user' })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversations retrieved successfully',
    type: [Conversation]
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findConversations(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Request() req: any,
  ) {
    return this.messagesService.findConversations(req.user.id, page, limit);
  }
}
