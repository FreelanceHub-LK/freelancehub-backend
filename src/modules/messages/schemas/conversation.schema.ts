import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ConversationDocument = Conversation & Document;

export enum ConversationStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  BLOCKED = 'blocked',
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Conversation extends Document {
  @ApiProperty({ description: 'Participants in the conversation' })
  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'User' }], 
    required: true,
    validate: {
      validator: function(participants: Types.ObjectId[]) {
        return participants.length === 2;
      },
      message: 'Conversation must have exactly 2 participants'
    }
  })
  participants: Types.ObjectId[];

  @ApiProperty({ description: 'Project related to this conversation' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Project', 
    required: false 
  })
  project?: Types.ObjectId;

  @ApiProperty({ description: 'Contract related to this conversation' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Contract', 
    required: false 
  })
  contract?: Types.ObjectId;

  @ApiProperty({ description: 'Last message in the conversation' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Message', 
    required: false 
  })
  lastMessage?: Types.ObjectId;

  @ApiProperty({ description: 'Conversation subject/title' })
  @Prop({ 
    type: String, 
    required: false,
    maxlength: 255
  })
  subject?: string;

  @ApiProperty({ 
    description: 'Conversation status',
    enum: ConversationStatus,
    default: ConversationStatus.ACTIVE
  })
  @Prop({ 
    type: String, 
    enum: ConversationStatus, 
    default: ConversationStatus.ACTIVE 
  })
  status: ConversationStatus;

  @ApiProperty({ description: 'Unread message count for each participant' })
  @Prop({
    type: Map,
    of: Number,
    default: new Map()
  })
  unreadCount: Map<string, number>;

  @ApiProperty({ description: 'Last activity timestamp for each participant' })
  @Prop({
    type: Map,
    of: Date,
    default: new Map()
  })
  lastSeen: Map<string, Date>;

  @ApiProperty({ description: 'Users who have muted this conversation' })
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: []
  })
  mutedBy: Types.ObjectId[];

  @ApiProperty({ description: 'Users who have pinned this conversation' })
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'User' }],
    default: []
  })
  pinnedBy: Types.ObjectId[];

  @ApiProperty({ description: 'Conversation metadata' })
  @Prop({
    type: Object,
    default: {}
  })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Conversation creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Conversation update timestamp' })
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Indexes for better query performance
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ project: 1 });
ConversationSchema.index({ contract: 1 });
ConversationSchema.index({ status: 1 });
ConversationSchema.index({ updatedAt: -1 });
