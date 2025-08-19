import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
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
export class Message extends Document {
  @ApiProperty({ description: 'Sender user ID' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  sender: Types.ObjectId;

  @ApiProperty({ description: 'Recipient user ID' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  recipient: Types.ObjectId;

  @ApiProperty({ description: 'Project ID if message is related to a project' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Project', 
    required: false 
  })
  project?: Types.ObjectId;

  @ApiProperty({ description: 'Contract ID if message is related to a contract' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Contract', 
    required: false 
  })
  contract?: Types.ObjectId;

  @ApiProperty({ description: 'Message content' })
  @Prop({ 
    type: String, 
    required: true,
    maxlength: 10000
  })
  content: string;

  @ApiProperty({ 
    description: 'Message type',
    enum: MessageType,
    default: MessageType.TEXT
  })
  @Prop({ 
    type: String, 
    enum: MessageType, 
    default: MessageType.TEXT 
  })
  type: MessageType;

  @ApiProperty({ 
    description: 'Message status',
    enum: MessageStatus,
    default: MessageStatus.SENT
  })
  @Prop({ 
    type: String, 
    enum: MessageStatus, 
    default: MessageStatus.SENT 
  })
  status: MessageStatus;

  @ApiProperty({ description: 'File attachments' })
  @Prop({
    type: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String,
    }],
    default: []
  })
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
  }[];

  @ApiProperty({ description: 'Message this is replying to' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Message', 
    required: false 
  })
  replyTo?: Types.ObjectId;

  @ApiProperty({ description: 'Whether message is edited' })
  @Prop({ 
    type: Boolean, 
    default: false 
  })
  isEdited: boolean;

  @ApiProperty({ description: 'When message was read by recipient' })
  @Prop({ 
    type: Date, 
    required: false 
  })
  readAt?: Date;

  @ApiProperty({ description: 'When message was delivered' })
  @Prop({ 
    type: Date, 
    required: false 
  })
  deliveredAt?: Date;

  @ApiProperty({ description: 'Whether message is deleted by sender' })
  @Prop({ 
    type: Boolean, 
    default: false 
  })
  deletedBySender: boolean;

  @ApiProperty({ description: 'Whether message is deleted by recipient' })
  @Prop({ 
    type: Boolean, 
    default: false 
  })
  deletedByRecipient: boolean;

  @ApiProperty({ description: 'Message metadata' })
  @Prop({
    type: Object,
    default: {}
  })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Message creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Message update timestamp' })
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for better query performance
MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
MessageSchema.index({ project: 1, createdAt: -1 });
MessageSchema.index({ contract: 1, createdAt: -1 });
MessageSchema.index({ status: 1 });
MessageSchema.index({ createdAt: -1 });
