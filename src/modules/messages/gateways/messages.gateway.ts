import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagesService } from '../messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/messages',
})
@UsePipes(new ValidationPipe())
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private readonly messagesService: MessagesService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract user from JWT token
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token`);
        client.disconnect();
        return;
      }

      // Here you would verify the JWT token and extract user info
      // For now, we'll assume the user info is passed in the handshake
      const userId = client.handshake.auth?.userId;
      
      if (!userId) {
        this.logger.warn(`Client ${client.id} connected without userId`);
        client.disconnect();
        return;
      }

      client.userId = userId;
      
      // Add user to connected users map
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(client.id);

      // Join user to their personal room
      client.join(`user:${userId}`);

      // Get user's conversations and join conversation rooms
      const conversations = await this.messagesService.findConversations(userId, 1, 100);
      for (const conversation of conversations.conversations) {
        client.join(`conversation:${conversation._id}`);
      }

      this.logger.log(`User ${userId} connected with socket ${client.id}`);
      
      // Notify user's connections that they're online
      this.server.to(`user:${userId}`).emit('user:online', { userId });

    } catch (error) {
      this.logger.error(`Error handling connection for ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      const userSockets = this.connectedUsers.get(client.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(client.userId);
          // Notify that user is offline
          this.server.to(`user:${client.userId}`).emit('user:offline', { userId: client.userId });
        }
      }
      this.logger.log(`User ${client.userId} disconnected socket ${client.id}`);
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      if (!client.userId) {
        throw new Error('User not authenticated');
      }

      // Create the message
      const message = await this.messagesService.createMessage(createMessageDto, client.userId);

      // Find conversation room
      const conversation = await this.messagesService.findOrCreateConversation({
        participants: [client.userId, createMessageDto.recipient],
        project: createMessageDto.project,
        contract: createMessageDto.contract,
      });

      // Emit to conversation room
      this.server.to(`conversation:${conversation._id}`).emit('message:received', {
        message,
        conversationId: conversation._id,
      });

      // Emit to recipient's personal room for real-time notifications
      this.server.to(`user:${createMessageDto.recipient}`).emit('message:notification', {
        message,
        conversationId: conversation._id,
        sender: {
          id: client.userId,
          name: client.user?.firstName || 'User', // Use authenticated user data
        },
      });

      return { success: true, message };
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`);
      client.emit('message:error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('message:typing')
  async handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    if (!client.userId) return;

    // Broadcast typing status to conversation room (excluding sender)
    client.to(`conversation:${data.conversationId}`).emit('message:typing', {
      userId: client.userId,
      isTyping: data.isTyping,
      conversationId: data.conversationId,
    });
  }

  @SubscribeMessage('message:read')
  async handleMarkAsRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      if (!client.userId) {
        throw new Error('User not authenticated');
      }

      await this.messagesService.markAsRead(data.messageId, client.userId);

      // Notify the sender that their message was read
      const message = await this.messagesService.findMessageById(data.messageId, client.userId);
      this.server.to(`user:${message.sender._id}`).emit('message:read', {
        messageId: data.messageId,
        readBy: client.userId,
        readAt: new Date(),
      });

      return { success: true };
    } catch (error) {
      this.logger.error(`Error marking message as read: ${error.message}`);
      client.emit('message:error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (!client.userId) return;

    try {
      // Verify user has access to this conversation
      const conversations = await this.messagesService.findConversations(client.userId);
      const hasAccess = conversations.conversations.some(
        conv => String(conv._id) === data.conversationId
      );

      if (hasAccess) {
        client.join(`conversation:${data.conversationId}`);
        this.logger.log(`User ${client.userId} joined conversation ${data.conversationId}`);
        return { success: true };
      } else {
        throw new Error('Access denied to conversation');
      }
    } catch (error) {
      this.logger.error(`Error joining conversation: ${error.message}`);
      client.emit('conversation:error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('conversation:leave')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
    this.logger.log(`User ${client.userId} left conversation ${data.conversationId}`);
    return { success: true };
  }

  // Helper method to send notification to specific user
  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:received', notification);
  }

  // Helper method to check if user is online
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Helper method to get online users count
  getOnlineUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Helper method to broadcast system message
  broadcastSystemMessage(message: any) {
    this.server.emit('system:message', message);
  }
}
