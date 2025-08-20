import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DisputeDocument = Dispute & Document;

export enum DisputeStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export enum DisputeType {
  PAYMENT_ISSUE = 'payment_issue',
  QUALITY_ISSUE = 'quality_issue',
  COMMUNICATION_ISSUE = 'communication_issue',
  SCOPE_DISAGREEMENT = 'scope_disagreement',
  DEADLINE_DISPUTE = 'deadline_dispute',
  REFUND_REQUEST = 'refund_request',
  OTHER = 'other',
}

export enum DisputePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ _id: false })
export class DisputeResponse {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  responder: Types.ObjectId;

  @Prop({ required: true })
  response: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ default: Date.now })
  date: Date;
}

@Schema({ _id: false })
export class DisputeTimeline {
  @Prop({ required: true })
  action: string;

  @Prop({ default: Date.now })
  date: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  performedBy: Types.ObjectId;

  @Prop()
  details?: string;
}

@Schema({ _id: false })
export class DisputeResolution {
  @Prop({ required: true })
  resolution: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  resolutionBy: Types.ObjectId;

  @Prop({ default: Date.now })
  resolutionDate: Date;

  @Prop()
  compensationAmount?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  compensationTo?: Types.ObjectId;
}

@Schema({ timestamps: true })
export class Dispute {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: DisputeType, required: true })
  type: DisputeType;

  @Prop({ type: String, enum: DisputeStatus, default: DisputeStatus.OPEN })
  status: DisputeStatus;

  @Prop({ type: String, enum: DisputePriority, default: DisputePriority.MEDIUM })
  priority: DisputePriority;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  raisedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  raisedAgainst: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project' })
  project?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Contract' })
  contract?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  assignedModerator?: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: [DisputeResponse], default: [] })
  responses: DisputeResponse[];

  @Prop({ type: [DisputeTimeline], default: [] })
  timeline: DisputeTimeline[];

  @Prop({ type: DisputeResolution })
  resolution?: DisputeResolution;

  @Prop()
  escalationReason?: string;

  @Prop()
  resolvedAt?: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const DisputeSchema = SchemaFactory.createForClass(Dispute);

// Add indexes for better query performance
DisputeSchema.index({ raisedBy: 1, status: 1 });
DisputeSchema.index({ raisedAgainst: 1, status: 1 });
DisputeSchema.index({ project: 1 });
DisputeSchema.index({ contract: 1 });
DisputeSchema.index({ status: 1, createdAt: -1 });
DisputeSchema.index({ assignedModerator: 1, status: 1 });
