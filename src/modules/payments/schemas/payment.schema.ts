import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Project } from '../../projects/schemas/project.schema';

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  PARTIAL_REFUND = 'partial_refund',
}

export enum PaymentType {
  PROJECT_PAYMENT = 'project_payment',
  MILESTONE_PAYMENT = 'milestone_payment',
  ESCROW_RELEASE = 'escrow_release',
  REFUND = 'refund',
  WITHDRAWAL = 'withdrawal',
  PLATFORM_FEE = 'platform_fee',
}

export enum PaymentMethod {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK_TRANSFER = 'bank_transfer',
  WALLET = 'wallet',
}

export interface PaymentMetadata {
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  paypalTransactionId?: string;
  bankTransferReference?: string;
  description?: string;
  currency?: string;
  exchangeRate?: number;
  platformFeeAmount?: number;
  freelancerEarnings?: number;
  [key: string]: any;
}

export interface EscrowDetails {
  isEscrow: boolean;
  escrowReleaseConditions?: string[];
  milestoneId?: string;
  releaseDate?: Date;
  disputeId?: string;
  autoReleaseEnabled?: boolean;
  autoReleaseDays?: number;
}

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  amount: number;

  @Prop({ default: 'USD' })
  currency: string;

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentStatus), 
    default: PaymentStatus.PENDING 
  })
  status: PaymentStatus;

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentType), 
    required: true 
  })
  type: PaymentType;

  @Prop({ 
    type: String, 
    enum: Object.values(PaymentMethod), 
    required: true 
  })
  method: PaymentMethod;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  payer: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  recipient: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project' })
  project: Project;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata: PaymentMetadata;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  escrowDetails: EscrowDetails;

  @Prop()
  description: string;

  @Prop()
  transactionId: string;

  @Prop()
  processingFee: number;

  @Prop()
  platformFee: number;

  @Prop()
  netAmount: number;

  @Prop()
  processedAt: Date;

  @Prop()
  failureReason: string;

  @Prop({ default: false })
  isRefundable: boolean;

  @Prop()
  refundDeadline: Date;

  @Prop([{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Payment' 
  }])
  relatedPayments: Payment[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Payment' })
  parentPayment: Payment;

  @Prop({ default: true })
  isActive: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);