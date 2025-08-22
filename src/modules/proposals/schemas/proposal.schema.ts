import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../users/schemas/user.schema';
import { Project } from '../../projects/schemas/project.schema';

export enum ProposalStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export type ProposalDocument = Proposal & Document;

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
export class Proposal {
  @ApiProperty({ description: 'Freelancer submitting the proposal' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  freelancer: User;

  @ApiProperty({ description: 'Project being bid on' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true })
  project: Project;

  @ApiProperty({ description: 'Cover letter or pitch' })
  @Prop({ required: true, maxlength: 5000 })
  coverLetter: string;

  @ApiProperty({ description: 'Proposed budget amount' })
  @Prop({ required: true, min: 0 })
  proposedBudget: number;

  @ApiProperty({ description: 'Delivery timeline description' })
  @Prop({ required: true, maxlength: 500 })
  deliveryTimeline: string;

  @ApiProperty({ description: 'Proposed milestones for the project' })
  @Prop({
    type: [{
      title: { type: String, required: true, maxlength: 255 },
      description: { type: String, required: true, maxlength: 2000 },
      amount: { type: Number, required: true, min: 0 },
      duration: { type: String, required: true, maxlength: 100 },
    }],
    default: []
  })
  milestones: {
    title: string;
    description: string;
    amount: number;
    duration: string;
  }[];

  @ApiProperty({ description: 'Portfolio items referenced in proposal' })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio' }])
  portfolioItems: string[];

  @ApiProperty({ 
    description: 'Proposal status',
    enum: ProposalStatus
  })
  @Prop({ 
    type: String, 
    enum: Object.values(ProposalStatus), 
    default: ProposalStatus.SUBMITTED 
  })
  status: ProposalStatus;

  @ApiProperty({ description: 'Proposal attachments' })
  @Prop({
    type: [{
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      url: String,
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
    uploadedAt: Date;
  }[];

  @ApiProperty({ description: 'Competition level when submitted' })
  @Prop({ 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'low' 
  })
  competitionLevel: string;

  @ApiProperty({ description: 'Total proposals count when this was submitted' })
  @Prop({ default: 0, min: 0 })
  totalProposals: number;

  @ApiProperty({ description: 'Whether the proposal is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Proposal creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Proposal update timestamp' })
  updatedAt: Date;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);

// Create unique compound index to prevent duplicate proposals
ProposalSchema.index({ freelancer: 1, project: 1 }, { unique: true });

// Indexes for better query performance
ProposalSchema.index({ project: 1 });
ProposalSchema.index({ freelancer: 1 });
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ proposedBudget: 1 });
ProposalSchema.index({ createdAt: -1 });
ProposalSchema.index({ 
  coverLetter: 'text' 
});