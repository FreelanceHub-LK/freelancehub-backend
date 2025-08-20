import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { 
  Message, 
  MessageDocument, 
  MessageStatus 
} from './schemas/message.schema';
import { 
  Conversation, 
  ConversationDocument, 
  ConversationStatus 
} from './schemas/conversation.schema';
import { 
  CreateMessageDto, 
  UpdateMessageDto, 
  QueryMessageDto,
  CreateConversationDto 
} from './dto';

export interface MessageListResult {
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationListResult {
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(Conversation.name) private conversationModel: Model<ConversationDocument>,
  ) {}

  // Message CRUD operations
  async createMessage(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
    try {
      // Validate sender and recipient are different
      if (senderId === createMessageDto.recipient) {
        throw new BadRequestException('Cannot send message to yourself');
      }

      // Find or create conversation
      let conversation = await this.findOrCreateConversation({
        participants: [senderId, createMessageDto.recipient],
        project: createMessageDto.project,
        contract: createMessageDto.contract,
      });

      // Create the message
      const message = new this.messageModel({
        ...createMessageDto,
        sender: senderId,
      });

      const savedMessage = await message.save();

      // Update conversation with last message
      await this.conversationModel.findByIdAndUpdate(
        conversation._id,
        {
          lastMessage: savedMessage._id,
          $inc: {
            [`unreadCount.${createMessageDto.recipient}`]: 1,
          },
          updatedAt: new Date(),
        }
      );

      await savedMessage.populate(['sender', 'recipient', 'project', 'contract', 'replyTo']);
      
      this.logger.log(`Message created: ${savedMessage._id}`);
      return savedMessage;
    } catch (error) {
      this.logger.error(`Failed to create message: ${error.message}`);
      throw error;
    }
  }

  async findMessages(query: QueryMessageDto, userId: string): Promise<MessageListResult> {
    try {
      const filter: any = {};

      // Only show messages where user is sender or recipient
      filter.$or = [
        { sender: userId },
        { recipient: userId }
      ];

      // Apply additional filters
      if (query.participant) {
        filter.$and = [
          filter.$or,
          {
            $or: [
              { sender: query.participant, recipient: userId },
              { sender: userId, recipient: query.participant }
            ]
          }
        ];
        delete filter.$or;
      }

      if (query.project) {
        filter.project = query.project;
      }

      if (query.contract) {
        filter.contract = query.contract;
      }

      if (query.type) {
        filter.type = query.type;
      }

      if (query.status) {
        filter.status = query.status;
      }

      if (query.search) {
        filter.content = { $regex: query.search, $options: 'i' };
      }

      if (!query.includeDeleted) {
        filter.$and = filter.$and || [];
        filter.$and.push({
          $or: [
            { deletedBySender: false, sender: userId },
            { deletedByRecipient: false, recipient: userId }
          ]
        });
      }

      const skip = ((query.page || 1) - 1) * (query.limit || 10);
      const sortField = query.sortBy || 'createdAt';
      const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

      const [messages, total] = await Promise.all([
        this.messageModel
          .find(filter)
          .populate('sender', 'name email avatar')
          .populate('recipient', 'name email avatar')
          .populate('project', 'title')
          .populate('contract', 'title')
          .populate('replyTo')
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(query.limit || 10)
          .exec(),
        this.messageModel.countDocuments(filter),
      ]);

      return {
        messages,
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      };
    } catch (error) {
      this.logger.error(`Failed to find messages: ${error.message}`);
      throw new BadRequestException('Failed to retrieve messages');
    }
  }

  async findMessageById(id: string, userId: string): Promise<Message> {
    try {
      const message = await this.messageModel
        .findById(id)
        .populate('sender', 'name email avatar')
        .populate('recipient', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('replyTo')
        .exec();

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Check if user has access to this message
      if (message.sender.toString() !== userId && message.recipient.toString() !== userId) {
        throw new ForbiddenException('Access denied to this message');
      }

      return message;
    } catch (error) {
      this.logger.error(`Failed to find message ${id}: ${error.message}`);
      throw error;
    }
  }

  async updateMessage(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<Message> {
    try {
      const message = await this.messageModel.findById(id);

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Only sender can edit message content
      if (message.sender.toString() !== userId && updateMessageDto.content) {
        throw new ForbiddenException('Only message sender can edit content');
      }

      // Update message
      const updatedMessage = await this.messageModel
        .findByIdAndUpdate(
          id,
          { 
            ...updateMessageDto,
            ...(updateMessageDto.content && { isEdited: true })
          },
          { new: true }
        )
        .populate('sender', 'name email avatar')
        .populate('recipient', 'name email avatar')
        .populate('project', 'title')
        .populate('contract', 'title')
        .populate('replyTo')
        .exec();

      if (!updatedMessage) {
        throw new NotFoundException('Message not found');
      }

      this.logger.log(`Message updated: ${id}`);
      return updatedMessage;
    } catch (error) {
      this.logger.error(`Failed to update message ${id}: ${error.message}`);
      throw error;
    }
  }

  async deleteMessage(id: string, userId: string): Promise<void> {
    try {
      const message = await this.messageModel.findById(id);

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Check if user has access to this message
      if (message.sender.toString() !== userId && message.recipient.toString() !== userId) {
        throw new ForbiddenException('Access denied to this message');
      }

      // Soft delete based on user role
      const updateData: any = {};
      if (message.sender.toString() === userId) {
        updateData.deletedBySender = true;
      }
      if (message.recipient.toString() === userId) {
        updateData.deletedByRecipient = true;
      }

      await this.messageModel.findByIdAndUpdate(id, updateData);

      this.logger.log(`Message deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Failed to delete message ${id}: ${error.message}`);
      throw error;
    }
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const message = await this.messageModel.findById(messageId);

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Only recipient can mark as read
      if (message.recipient.toString() !== userId) {
        throw new ForbiddenException('Only recipient can mark message as read');
      }

      await this.messageModel.findByIdAndUpdate(messageId, {
        status: MessageStatus.READ,
        readAt: new Date(),
      });

      // Update conversation unread count
      await this.conversationModel.updateOne(
        {
          participants: { $all: [message.sender, message.recipient] },
          [`unreadCount.${userId}`]: { $gt: 0 }
        },
        {
          $inc: { [`unreadCount.${userId}`]: -1 }
        }
      );

      this.logger.log(`Message marked as read: ${messageId}`);
    } catch (error) {
      this.logger.error(`Failed to mark message as read ${messageId}: ${error.message}`);
      throw error;
    }
  }

  // Conversation operations
  async createConversation(createConversationDto: CreateConversationDto): Promise<Conversation> {
    try {
      // Validate participants
      if (createConversationDto.participants.length !== 2) {
        throw new BadRequestException('Conversation must have exactly 2 participants');
      }

      if (createConversationDto.participants[0] === createConversationDto.participants[1]) {
        throw new BadRequestException('Conversation participants must be different');
      }

      // Check if conversation already exists
      const existingConversation = await this.conversationModel.findOne({
        participants: { $all: createConversationDto.participants },
        project: createConversationDto.project || { $exists: false },
        contract: createConversationDto.contract || { $exists: false },
      });

      if (existingConversation) {
        return existingConversation;
      }

      const conversation = new this.conversationModel(createConversationDto);
      const savedConversation = await conversation.save();

      await savedConversation.populate('participants', 'name email avatar');
      
      this.logger.log(`Conversation created: ${savedConversation._id}`);
      return savedConversation;
    } catch (error) {
      this.logger.error(`Failed to create conversation: ${error.message}`);
      throw error;
    }
  }

  async findConversations(userId: string, page: number = 1, limit: number = 20): Promise<ConversationListResult> {
    try {
      const filter = {
        participants: userId,
        status: ConversationStatus.ACTIVE,
      };

      const skip = (page - 1) * limit;

      const [conversations, total] = await Promise.all([
        this.conversationModel
          .find(filter)
          .populate('participants', 'name email avatar')
          .populate('lastMessage')
          .populate('project', 'title')
          .populate('contract', 'title')
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.conversationModel.countDocuments(filter),
      ]);

      return {
        conversations,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Failed to find conversations: ${error.message}`);
      throw new BadRequestException('Failed to retrieve conversations');
    }
  }

  // Make this method public for use in gateway
  async findOrCreateConversation(data: {
    participants: string[];
    project?: string;
    contract?: string;
  }): Promise<Conversation> {
    let conversation = await this.conversationModel.findOne({
      participants: { $all: data.participants },
      ...(data.project && { project: data.project }),
      ...(data.contract && { contract: data.contract }),
    });

    if (!conversation) {
      const newConversation = await this.createConversation({
        participants: data.participants,
        project: data.project,
        contract: data.contract,
      });
      conversation = newConversation as any; // Type assertion to handle Mongoose document type
    }

    return conversation as any;
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const conversations = await this.conversationModel.find({
        participants: userId,
        status: ConversationStatus.ACTIVE,
      });

      let totalUnread = 0;
      for (const conversation of conversations) {
        const unreadCount = conversation.unreadCount.get(userId) || 0;
        totalUnread += unreadCount;
      }

      return totalUnread;
    } catch (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`);
      return 0;
    }
  }
}
