import { Injectable, NotFoundException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationDocument, NotificationType, NotificationPriority } from './schemas/notification.schema';
import { EmailService } from '../email/email.service';

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  emailTemplate?: string;
  actionUrl?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private readonly emailService: EmailService,
    @Inject(forwardRef(() => 'MessagesGateway'))
    private readonly messagesGateway?: any,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<NotificationDocument> {
    const notification = new this.notificationModel({
      ...createNotificationDto,
      expiresAt: createNotificationDto.expiresAt ? new Date(createNotificationDto.expiresAt) : undefined,
    });
    return notification.save();
  }

  async createAndSend(
    userId: string,
    type: NotificationType,
    data: {
      title: string;
      message: string;
      actionUrl?: string;
      metadata?: Record<string, any>;
      priority?: NotificationPriority;
      emailEnabled?: boolean;
      pushEnabled?: boolean;
    }
  ): Promise<Notification> {
    try {
      // Create notification
      const notification = await this.create({
        userId,
        type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        metadata: data.metadata || {},
        priority: data.priority || NotificationPriority.MEDIUM,
      });

      // Send real-time notification via WebSocket
      if (this.messagesGateway) {
        await this.messagesGateway.sendNotificationToUser(userId, {
          id: (notification._id as any).toString(),
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          priority: notification.priority,
          createdAt: notification.createdAt,
        });
      }

      // Send email notification if enabled
      if (data.emailEnabled && process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
        await this.sendEmailNotification(userId, notification);
      }

      // Send push notification if enabled
      if (data.pushEnabled && process.env.ENABLE_PUSH_NOTIFICATIONS === 'true') {
        await this.sendPushNotification(userId, notification);
      }

      this.logger.log(`Notification created and sent to user ${userId}: ${type}`);
      return notification;
    } catch (error) {
      this.logger.error(`Failed to create and send notification: ${error.message}`);
      throw error;
    }
  }

  private async sendEmailNotification(userId: string, notification: Notification): Promise<void> {
    try {
      // You would typically fetch user email from user service
      // For now, we'll assume we have the user data in the notification
      const userEmail = notification.metadata?.userEmail;
      const userName = notification.metadata?.userName;

      if (!userEmail) {
        this.logger.warn(`No email found for user ${userId}, skipping email notification`);
        return;
      }

      // Map notification types to email templates
      const emailTemplateMap: Partial<Record<NotificationType, string>> = {
        [NotificationType.PROJECT_UPDATED]: 'project-notification',
        [NotificationType.PROPOSAL_SUBMITTED]: 'project-notification',
        [NotificationType.PROPOSAL_ACCEPTED]: 'project-notification',
        [NotificationType.PAYMENT_RECEIVED]: 'payment-notification',
        [NotificationType.MESSAGE_RECEIVED]: 'message-notification',
        [NotificationType.CONTRACT_SIGNED]: 'contract-notification',
        [NotificationType.MILESTONE_COMPLETED]: 'project-notification',
        [NotificationType.REVIEW_RECEIVED]: 'review-notification',
        [NotificationType.SYSTEM_ANNOUNCEMENT]: 'system-notification',
      };

      const template = emailTemplateMap[notification.type];
      if (template) {
        await this.emailService.sendEmail({
          to: userEmail,
          subject: notification.title,
          template,
          templateData: {
            userName,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.actionUrl,
            ...notification.metadata,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
    }
  }

  private async sendPushNotification(userId: string, notification: Notification): Promise<void> {
    try {
      // Implement push notification logic here
      // This would typically use a service like Firebase Cloud Messaging
      this.logger.log(`Push notification would be sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to send push notification: ${error.message}`);
    }
  }

  // Specific notification methods for different events
  async sendProjectNotification(
    userId: string,
    type: 'new_proposal' | 'proposal_accepted' | 'project_completed' | 'milestone_completed',
    data: {
      projectTitle: string;
      projectId: string;
      userEmail: string;
      userName: string;
      additionalData?: Record<string, any>;
    }
  ): Promise<void> {
    const notifications = {
      new_proposal: {
        title: 'New Proposal Received',
        message: `You have received a new proposal for "${data.projectTitle}"`,
        type: NotificationType.PROPOSAL_SUBMITTED,
      },
      proposal_accepted: {
        title: 'Proposal Accepted',
        message: `Your proposal for "${data.projectTitle}" has been accepted!`,
        type: NotificationType.PROPOSAL_ACCEPTED,
      },
      project_completed: {
        title: 'Project Completed',
        message: `Project "${data.projectTitle}" has been marked as completed`,
        type: NotificationType.PROJECT_UPDATED,
      },
      milestone_completed: {
        title: 'Milestone Completed',
        message: `A milestone for "${data.projectTitle}" has been completed`,
        type: NotificationType.MILESTONE_COMPLETED,
      },
    };

    const notificationData = notifications[type];
    await this.createAndSend(userId, notificationData.type, {
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: `/projects/${data.projectId}`,
      metadata: {
        projectId: data.projectId,
        projectTitle: data.projectTitle,
        userEmail: data.userEmail,
        userName: data.userName,
        ...data.additionalData,
      },
      emailEnabled: true,
      priority: NotificationPriority.HIGH,
    });
  }

  async sendPaymentNotification(
    userId: string,
    type: 'payment_received' | 'payment_sent' | 'escrow_released',
    data: {
      amount: number;
      currency: string;
      transactionId: string;
      userEmail: string;
      userName: string;
    }
  ): Promise<void> {
    const notifications = {
      payment_received: {
        title: 'Payment Received',
        message: `You have received a payment of ${data.currency} ${data.amount}`,
      },
      payment_sent: {
        title: 'Payment Sent',
        message: `Your payment of ${data.currency} ${data.amount} has been processed`,
      },
      escrow_released: {
        title: 'Escrow Released',
        message: `Escrow payment of ${data.currency} ${data.amount} has been released`,
      },
    };

    const notificationData = notifications[type];
    await this.createAndSend(userId, NotificationType.PAYMENT_RECEIVED, {
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: '/payments',
      metadata: {
        amount: data.amount,
        currency: data.currency,
        transactionId: data.transactionId,
        userEmail: data.userEmail,
        userName: data.userName,
      },
      emailEnabled: true,
      priority: NotificationPriority.HIGH,
    });
  }

  async sendMessageNotification(
    userId: string,
    data: {
      senderName: string;
      messagePreview: string;
      conversationId: string;
      userEmail: string;
      userName: string;
    }
  ): Promise<void> {
    await this.createAndSend(userId, NotificationType.MESSAGE_RECEIVED, {
      title: `New message from ${data.senderName}`,
      message: data.messagePreview,
      actionUrl: `/messages/${data.conversationId}`,
      metadata: {
        conversationId: data.conversationId,
        senderName: data.senderName,
        userEmail: data.userEmail,
        userName: data.userName,
      },
      emailEnabled: true,
      priority: NotificationPriority.MEDIUM,
    });
  }

  async sendContractNotification(
    userId: string,
    type: 'contract_created' | 'contract_signed' | 'contract_completed',
    data: {
      contractTitle: string;
      contractId: string;
      userEmail: string;
      userName: string;
    }
  ): Promise<void> {
    const notifications = {
      contract_created: {
        title: 'New Contract Created',
        message: `A new contract "${data.contractTitle}" has been created`,
      },
      contract_signed: {
        title: 'Contract Signed',
        message: `Contract "${data.contractTitle}" has been signed`,
      },
      contract_completed: {
        title: 'Contract Completed',
        message: `Contract "${data.contractTitle}" has been completed`,
      },
    };

    const notificationData = notifications[type];
    await this.createAndSend(userId, NotificationType.CONTRACT_SIGNED, {
      title: notificationData.title,
      message: notificationData.message,
      actionUrl: `/contracts/${data.contractId}`,
      metadata: {
        contractId: data.contractId,
        contractTitle: data.contractTitle,
        userEmail: data.userEmail,
        userName: data.userName,
      },
      emailEnabled: true,
      priority: NotificationPriority.HIGH,
    });
  }

  async createBulk(notifications: CreateNotificationDto[]): Promise<Notification[]> {
    const notificationDocs = notifications.map(notification => ({
      ...notification,
      expiresAt: notification.expiresAt ? new Date(notification.expiresAt) : undefined,
    }));
    const created = await this.notificationModel.insertMany(notificationDocs);
    return created as any; // Type assertion to handle Mongoose document type
  }

  async findAll(page = 1, limit = 10): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find()
        .populate('userId', 'firstName lastName email avatar')
        .populate('triggeredBy', 'firstName lastName email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments().exec(),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUserNotifications(
    userId: string,
    page = 1,
    limit = 10,
    unreadOnly = false,
  ): Promise<{
    notifications: Notification[];
    total: number;
    page: number;
    totalPages: number;
    unreadCount: number;
  }> {
    const skip = (page - 1) * limit;
    const filter: any = { 
      userId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (unreadOnly) {
      filter.isRead = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .populate('triggeredBy', 'firstName lastName email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
      this.notificationModel.countDocuments({ 
        userId, 
        isRead: false,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } }
        ]
      }).exec(),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  }

  async findOne(id: string): Promise<Notification | null> {
    return this.notificationModel
      .findById(id)
      .populate('userId', 'firstName lastName email avatar')
      .populate('triggeredBy', 'firstName lastName email avatar')
      .exec();
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .populate('userId', 'firstName lastName email avatar')
      .populate('triggeredBy', 'firstName lastName email avatar')
      .exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.update(id, { isRead: true });
  }

  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const result = await this.notificationModel
      .updateMany(
        { 
          userId, 
          isRead: false,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        },
        { isRead: true }
      )
      .exec();

    return { modifiedCount: result.modifiedCount };
  }

  async remove(id: string): Promise<Notification> {
    const notification = await this.notificationModel.findByIdAndDelete(id).exec();
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async removeExpired(): Promise<{ deletedCount: number }> {
    const result = await this.notificationModel
      .deleteMany({
        expiresAt: { $exists: true, $lt: new Date() }
      })
      .exec();

    return { deletedCount: result.deletedCount };
  }

  async getUserNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  }> {
    const pipeline = [
      {
        $match: {
          userId,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: new Date() } }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          typeStats: {
            $push: {
              type: '$type',
              priority: '$priority'
            }
          }
        }
      }
    ];

    const result = await this.notificationModel.aggregate(pipeline).exec();
    
    if (!result.length) {
      return {
        total: 0,
        unread: 0,
        byType: {} as Record<NotificationType, number>,
        byPriority: {} as Record<NotificationPriority, number>,
      };
    }

    const stats = result[0];
    const byType = {} as Record<NotificationType, number>;
    const byPriority = {} as Record<NotificationPriority, number>;

    // Initialize counters
    Object.values(NotificationType).forEach(type => byType[type] = 0);
    Object.values(NotificationPriority).forEach(priority => byPriority[priority] = 0);

    // Count by type and priority
    stats.typeStats.forEach((item: any) => {
      byType[item.type] = (byType[item.type] || 0) + 1;
      byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
    });

    return {
      total: stats.total,
      unread: stats.unread,
      byType,
      byPriority,
    };
  }

  // Helper methods for creating specific notification types
  async notifyProjectCreated(
    clientId: string,
    projectId: string,
    projectTitle: string,
  ): Promise<Notification> {
    return this.create({
      userId: clientId,
      type: NotificationType.PROJECT_CREATED,
      title: 'Project Created',
      message: `Your project "${projectTitle}" has been successfully created.`,
      actionUrl: `/projects/${projectId}`,
      data: { projectId, projectTitle },
      priority: NotificationPriority.MEDIUM,
    });
  }

  async notifyProposalSubmitted(
    clientId: string,
    freelancerId: string,
    projectId: string,
    proposalId: string,
    projectTitle: string,
  ): Promise<Notification> {
    return this.create({
      userId: clientId,
      type: NotificationType.PROPOSAL_SUBMITTED,
      title: 'New Proposal Received',
      message: `You received a new proposal for "${projectTitle}".`,
      actionUrl: `/projects/${projectId}/proposals/${proposalId}`,
      data: { projectId, proposalId, projectTitle },
      triggeredBy: freelancerId,
      priority: NotificationPriority.HIGH,
    });
  }

  async notifyContractSigned(
    userId: string,
    contractId: string,
    projectTitle: string,
    triggeredBy: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.CONTRACT_SIGNED,
      title: 'Contract Signed',
      message: `Contract for "${projectTitle}" has been signed.`,
      actionUrl: `/contracts/${contractId}`,
      data: { contractId, projectTitle },
      triggeredBy,
      priority: NotificationPriority.HIGH,
    });
  }

  async notifyPaymentReceived(
    freelancerId: string,
    amount: number,
    currency: string,
    projectTitle: string,
    paymentId: string,
  ): Promise<Notification> {
    return this.create({
      userId: freelancerId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Payment Received',
      message: `You received ${amount} ${currency} for "${projectTitle}".`,
      actionUrl: `/payments/${paymentId}`,
      data: { amount, currency, projectTitle, paymentId },
      priority: NotificationPriority.HIGH,
    });
  }

  async notifyReviewReceived(
    revieweeId: string,
    reviewerId: string,
    rating: number,
    projectTitle: string,
    reviewId: string,
  ): Promise<Notification> {
    return this.create({
      userId: revieweeId,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'New Review Received',
      message: `You received a ${rating}-star review for "${projectTitle}".`,
      actionUrl: `/reviews/${reviewId}`,
      data: { rating, projectTitle, reviewId },
      triggeredBy: reviewerId,
      priority: NotificationPriority.MEDIUM,
    });
  }

  async notifyMessageReceived(
    recipientId: string,
    senderId: string,
    senderName: string,
    conversationId: string,
  ): Promise<Notification> {
    return this.create({
      userId: recipientId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'New Message',
      message: `You have a new message from ${senderName}.`,
      actionUrl: `/messages/${conversationId}`,
      data: { conversationId, senderName },
      triggeredBy: senderId,
      priority: NotificationPriority.MEDIUM,
    });
  }
}
