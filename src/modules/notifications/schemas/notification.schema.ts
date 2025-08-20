import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_CANCELLED = 'project_cancelled',
  PROPOSAL_SUBMITTED = 'proposal_submitted',
  PROPOSAL_ACCEPTED = 'proposal_accepted',
  PROPOSAL_REJECTED = 'proposal_rejected',
  CONTRACT_CREATED = 'contract_created',
  CONTRACT_SIGNED = 'contract_signed',
  CONTRACT_COMPLETED = 'contract_completed',
  MILESTONE_CREATED = 'milestone_created',
  MILESTONE_COMPLETED = 'milestone_completed',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_RELEASED = 'payment_released',
  REVIEW_RECEIVED = 'review_received',
  MESSAGE_RECEIVED = 'message_received',
  DISPUTE_CREATED = 'dispute_created',
  DISPUTE_RESOLVED = 'dispute_resolved',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ACCOUNT_VERIFIED = 'account_verified',
  WITHDRAWAL_PROCESSED = 'withdrawal_processed',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: Object })
  data?: any; // Additional data related to the notification

  @Prop({ type: Object })
  metadata?: any; // Additional metadata for notifications

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ enum: NotificationPriority, default: NotificationPriority.MEDIUM })
  priority: NotificationPriority;

  @Prop()
  actionUrl?: string; // URL to navigate to when notification is clicked

  @Prop({ type: Types.ObjectId, ref: 'User' })
  triggeredBy?: Types.ObjectId; // User who triggered this notification

  @Prop()
  expiresAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
