import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { Notification, NotificationDocument, NotificationType, NotificationPriority } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = new this.notificationModel({
      ...createNotificationDto,
      expiresAt: createNotificationDto.expiresAt ? new Date(createNotificationDto.expiresAt) : undefined,
    });
    return notification.save();
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
