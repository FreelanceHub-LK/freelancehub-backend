import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { UserRole } from '../users/schemas/user.schema';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  async create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('bulk')
  @Roles(UserRole.ADMIN)
  async createBulk(@Body() notifications: CreateNotificationDto[]) {
    return this.notificationsService.createBulk(notifications);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.notificationsService.findAll(Number(page), Number(limit));
  }

  @Get('my')
  async getMyNotifications(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const unreadFilter = unreadOnly === 'true';
    return this.notificationsService.findUserNotifications(
      req.user.id,
      Number(page),
      Number(limit),
      unreadFilter,
    );
  }

  @Get('stats')
  async getMyStats(@Request() req) {
    return this.notificationsService.getUserNotificationStats(req.user.id);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const unreadFilter = unreadOnly === 'true';
    return this.notificationsService.findUserNotifications(
      userId,
      Number(page),
      Number(limit),
      unreadFilter,
    );
  }

  @Get('user/:userId/stats')
  @Roles(UserRole.ADMIN)
  async getUserStats(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotificationStats(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const notification = await this.notificationsService.findOne(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Users can only access their own notifications (except admins)
    if (req.user.role !== UserRole.ADMIN && notification.userId.toString() !== req.user.id) {
      throw new ForbiddenException('You can only access your own notifications');
    }

    return notification;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @Request() req,
  ) {
    const notification = await this.notificationsService.findOne(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Users can only update their own notifications (except admins)
    if (req.user.role !== UserRole.ADMIN && notification.userId.toString() !== req.user.id) {
      throw new ForbiddenException('You can only update your own notifications');
    }

    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    const notification = await this.notificationsService.findOne(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Users can only mark their own notifications as read
    if (notification.userId.toString() !== req.user.id) {
      throw new ForbiddenException('You can only mark your own notifications as read');
    }

    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete('expired')
  @Roles(UserRole.ADMIN)
  async removeExpired() {
    return this.notificationsService.removeExpired();
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const notification = await this.notificationsService.findOne(id);
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Users can only delete their own notifications (except admins)
    if (req.user.role !== UserRole.ADMIN && notification.userId.toString() !== req.user.id) {
      throw new ForbiddenException('You can only delete your own notifications');
    }

    return this.notificationsService.remove(id);
  }

  // Helper endpoints for creating specific notification types
  @Post('project-created')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  async notifyProjectCreated(
    @Body() data: { clientId: string; projectId: string; projectTitle: string },
  ) {
    return this.notificationsService.notifyProjectCreated(
      data.clientId,
      data.projectId,
      data.projectTitle,
    );
  }

  @Post('proposal-submitted')
  @Roles(UserRole.ADMIN, UserRole.FREELANCER)
  async notifyProposalSubmitted(
    @Body() data: {
      clientId: string;
      freelancerId: string;
      projectId: string;
      proposalId: string;
      projectTitle: string;
    },
  ) {
    return this.notificationsService.notifyProposalSubmitted(
      data.clientId,
      data.freelancerId,
      data.projectId,
      data.proposalId,
      data.projectTitle,
    );
  }

  @Post('contract-signed')
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.FREELANCER)
  async notifyContractSigned(
    @Body() data: {
      userId: string;
      contractId: string;
      projectTitle: string;
      triggeredBy: string;
    },
  ) {
    return this.notificationsService.notifyContractSigned(
      data.userId,
      data.contractId,
      data.projectTitle,
      data.triggeredBy,
    );
  }

  @Post('payment-received')
  @Roles(UserRole.ADMIN, UserRole.CLIENT)
  async notifyPaymentReceived(
    @Body() data: {
      freelancerId: string;
      amount: number;
      currency: string;
      projectTitle: string;
      paymentId: string;
    },
  ) {
    return this.notificationsService.notifyPaymentReceived(
      data.freelancerId,
      data.amount,
      data.currency,
      data.projectTitle,
      data.paymentId,
    );
  }

  @Post('review-received')
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.FREELANCER)
  async notifyReviewReceived(
    @Body() data: {
      revieweeId: string;
      reviewerId: string;
      rating: number;
      projectTitle: string;
      reviewId: string;
    },
  ) {
    return this.notificationsService.notifyReviewReceived(
      data.revieweeId,
      data.reviewerId,
      data.rating,
      data.projectTitle,
      data.reviewId,
    );
  }

  @Post('message-received')
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.FREELANCER)
  async notifyMessageReceived(
    @Body() data: {
      recipientId: string;
      senderId: string;
      senderName: string;
      conversationId: string;
    },
  ) {
    return this.notificationsService.notifyMessageReceived(
      data.recipientId,
      data.senderId,
      data.senderName,
      data.conversationId,
    );
  }
}
