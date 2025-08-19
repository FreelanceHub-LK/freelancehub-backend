import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ReviewDocument = Review & Document;

export enum ReviewType {
  CLIENT_TO_FREELANCER = 'client_to_freelancer',
  FREELANCER_TO_CLIENT = 'freelancer_to_client',
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
export class Review extends Document {
  @ApiProperty({ description: 'User who gave the review' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  reviewer: Types.ObjectId;

  @ApiProperty({ description: 'User who received the review' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  })
  reviewee: Types.ObjectId;

  @ApiProperty({ description: 'Project this review is for' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Project', 
    required: true 
  })
  project: Types.ObjectId;

  @ApiProperty({ description: 'Contract this review is for' })
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Contract', 
    required: false 
  })
  contract?: Types.ObjectId;

  @ApiProperty({ 
    description: 'Type of review',
    enum: ReviewType
  })
  @Prop({ 
    type: String, 
    enum: ReviewType, 
    required: true 
  })
  type: ReviewType;

  @ApiProperty({ 
    description: 'Overall rating (1-5)',
    minimum: 1,
    maximum: 5
  })
  @Prop({ 
    type: Number, 
    required: true,
    min: 1,
    max: 5
  })
  rating: number;

  @ApiProperty({ description: 'Review title' })
  @Prop({ 
    type: String, 
    required: true,
    maxlength: 255
  })
  title: string;

  @ApiProperty({ description: 'Review comment' })
  @Prop({ 
    type: String, 
    required: true,
    maxlength: 2000
  })
  comment: string;

  @ApiProperty({ description: 'Detailed ratings breakdown' })
  @Prop({
    type: {
      communication: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      timeliness: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
    },
    required: false
  })
  detailedRatings?: {
    communication: number;
    quality: number;
    timeliness: number;
    professionalism: number;
    value: number;
  };

  @ApiProperty({ description: 'Skills demonstrated (for freelancer reviews)' })
  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Skill' }],
    default: []
  })
  skills: Types.ObjectId[];

  @ApiProperty({ description: 'Whether this review is public' })
  @Prop({ 
    type: Boolean, 
    default: true 
  })
  isPublic: boolean;

  @ApiProperty({ description: 'Whether this review is verified (project was completed)' })
  @Prop({ 
    type: Boolean, 
    default: false 
  })
  isVerified: boolean;

  @ApiProperty({ description: 'Review response from reviewee' })
  @Prop({
    type: {
      comment: { type: String, maxlength: 1000 },
      respondedAt: { type: Date, default: Date.now },
    },
    required: false
  })
  response?: {
    comment: string;
    respondedAt: Date;
  };

  @ApiProperty({ description: 'Whether review has been reported' })
  @Prop({ 
    type: Boolean, 
    default: false 
  })
  isReported: boolean;

  @ApiProperty({ description: 'Report details' })
  @Prop({
    type: {
      reason: String,
      reportedBy: { type: Types.ObjectId, ref: 'User' },
      reportedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['pending', 'reviewed', 'dismissed'], default: 'pending' },
    },
    required: false
  })
  reportDetails?: {
    reason: string;
    reportedBy: Types.ObjectId;
    reportedAt: Date;
    status: 'pending' | 'reviewed' | 'dismissed';
  };

  @ApiProperty({ description: 'Review metadata' })
  @Prop({
    type: Object,
    default: {}
  })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Review creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Review update timestamp' })
  updatedAt: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// Compound index to ensure one review per project per reviewer-reviewee pair
ReviewSchema.index({ reviewer: 1, reviewee: 1, project: 1 }, { unique: true });

// Indexes for better query performance
ReviewSchema.index({ reviewee: 1, isPublic: 1 });
ReviewSchema.index({ reviewer: 1 });
ReviewSchema.index({ project: 1 });
ReviewSchema.index({ type: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ isVerified: 1 });
ReviewSchema.index({ createdAt: -1 });
