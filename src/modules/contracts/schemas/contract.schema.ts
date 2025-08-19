import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ContractDocument = Contract & Document;

export enum ContractStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
  TERMINATED = 'terminated',
}

export enum ContractType {
  FIXED_PRICE = 'fixed_price',
  HOURLY = 'hourly',
  MILESTONE = 'milestone',
}

export enum MilestoneStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PAID = 'paid',
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
export class Contract extends Document {
  @ApiProperty({ description: 'Contract title' })
  @Prop({ 
    type: String, 
    required: true,
    maxlength: 255
  })
  title: string;

  @ApiProperty({ description: 'Contract description' })
  @Prop({ 
    type: String, 
    required: true,
    maxlength: 5000
  })
  description: string;

  @ApiProperty({ description: 'Project this contract is for' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Project', 
    required: true 
  })
  project: Types.ObjectId;

  @ApiProperty({ description: 'Client who created the contract' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  client: Types.ObjectId;

  @ApiProperty({ description: 'Freelancer assigned to the contract' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  freelancer: Types.ObjectId;

  @ApiProperty({ 
    description: 'Contract type',
    enum: ContractType
  })
  @Prop({ 
    type: String, 
    enum: ContractType, 
    required: true 
  })
  type: ContractType;

  @ApiProperty({ 
    description: 'Contract status',
    enum: ContractStatus,
    default: ContractStatus.DRAFT
  })
  @Prop({ 
    type: String, 
    enum: ContractStatus, 
    default: ContractStatus.DRAFT 
  })
  status: ContractStatus;

  @ApiProperty({ description: 'Contract total amount (in cents)' })
  @Prop({ 
    type: Number, 
    required: true,
    min: 0
  })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  @Prop({ 
    type: String, 
    required: true,
    default: 'USD'
  })
  currency: string;

  @ApiProperty({ description: 'Hourly rate (for hourly contracts)' })
  @Prop({ 
    type: Number, 
    required: false,
    min: 0
  })
  hourlyRate?: number;

  @ApiProperty({ description: 'Estimated hours (for hourly contracts)' })
  @Prop({ 
    type: Number, 
    required: false,
    min: 0
  })
  estimatedHours?: number;

  @ApiProperty({ description: 'Contract start date' })
  @Prop({ 
    type: Date, 
    required: true 
  })
  startDate: Date;

  @ApiProperty({ description: 'Contract end date' })
  @Prop({ 
    type: Date, 
    required: true 
  })
  endDate: Date;

  @ApiProperty({ description: 'Contract milestones' })
  @Prop({
    type: [{
      title: { type: String, required: true, maxlength: 255 },
      description: { type: String, required: true, maxlength: 2000 },
      amount: { type: Number, required: true, min: 0 },
      dueDate: { type: Date, required: true },
      status: { 
        type: String, 
        enum: MilestoneStatus, 
        default: MilestoneStatus.PENDING 
      },
      deliverables: [String],
      submittedAt: { type: Date, required: false },
      approvedAt: { type: Date, required: false },
      rejectedAt: { type: Date, required: false },
      paidAt: { type: Date, required: false },
      feedback: { type: String, required: false },
      attachments: [{
        filename: String,
        originalName: String,
        mimeType: String,
        size: Number,
        url: String,
      }],
    }],
    default: []
  })
  milestones: {
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: MilestoneStatus;
    deliverables: string[];
    submittedAt?: Date;
    approvedAt?: Date;
    rejectedAt?: Date;
    paidAt?: Date;
    feedback?: string;
    attachments: {
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      url: string;
    }[];
  }[];

  @ApiProperty({ description: 'Contract terms and conditions' })
  @Prop({ 
    type: String, 
    required: false,
    maxlength: 10000
  })
  terms?: string;

  @ApiProperty({ description: 'Contract scope of work' })
  @Prop({ 
    type: String, 
    required: false,
    maxlength: 5000
  })
  scope?: string;

  @ApiProperty({ description: 'Payment terms' })
  @Prop({ 
    type: String, 
    required: false,
    maxlength: 2000
  })
  paymentTerms?: string;

  @ApiProperty({ description: 'Platform fee percentage' })
  @Prop({ 
    type: Number, 
    required: false,
    min: 0,
    max: 100,
    default: 5
  })
  platformFee?: number;

  @ApiProperty({ description: 'Total amount paid' })
  @Prop({ 
    type: Number, 
    default: 0,
    min: 0
  })
  paidAmount: number;

  @ApiProperty({ description: 'Contract signature by client' })
  @Prop({
    type: {
      signedAt: Date,
      ipAddress: String,
      userAgent: String,
    },
    required: false
  })
  clientSignature?: {
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
  };

  @ApiProperty({ description: 'Contract signature by freelancer' })
  @Prop({
    type: {
      signedAt: Date,
      ipAddress: String,
      userAgent: String,
    },
    required: false
  })
  freelancerSignature?: {
    signedAt: Date;
    ipAddress: string;
    userAgent: string;
  };

  @ApiProperty({ description: 'Contract attachments' })
  @Prop({
    type: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String,
      uploadedBy: { type: Types.ObjectId, ref: 'User' },
      uploadedAt: { type: Date, default: Date.now },
    }],
    default: []
  })
  attachments: {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedBy: Types.ObjectId;
    uploadedAt: Date;
  }[];

  @ApiProperty({ description: 'Contract cancellation reason' })
  @Prop({ 
    type: String, 
    required: false,
    maxlength: 1000
  })
  cancellationReason?: string;

  @ApiProperty({ description: 'Who cancelled the contract' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: false 
  })
  cancelledBy?: Types.ObjectId;

  @ApiProperty({ description: 'Contract cancellation date' })
  @Prop({ 
    type: Date, 
    required: false 
  })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Contract completion date' })
  @Prop({ 
    type: Date, 
    required: false 
  })
  completedAt?: Date;

  @ApiProperty({ description: 'Contract metadata' })
  @Prop({
    type: Object,
    default: {}
  })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Contract creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Contract update timestamp' })
  updatedAt: Date;
}

export const ContractSchema = SchemaFactory.createForClass(Contract);

// Indexes for better query performance
ContractSchema.index({ project: 1 });
ContractSchema.index({ client: 1 });
ContractSchema.index({ freelancer: 1 });
ContractSchema.index({ status: 1 });
ContractSchema.index({ type: 1 });
ContractSchema.index({ startDate: 1, endDate: 1 });
ContractSchema.index({ createdAt: -1 });
