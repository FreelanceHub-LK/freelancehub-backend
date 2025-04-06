import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Project } from '../../projects/schemas/project.schema';

export enum ProposalStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export type ProposalDocument = Proposal & Document;

@Schema({ timestamps: true })
export class Proposal {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  freelancer: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true })
  project: Project;

  @Prop({ required: true })
  coverLetter: string;

  @Prop({ required: true, min: 0 })
  bidAmount: number;

  @Prop({ required: true, min: 1 })
  estimatedDays: number;

  @Prop({ 
    type: String, 
    enum: Object.values(ProposalStatus), 
    default: ProposalStatus.PENDING 
  })
  status: ProposalStatus;

  @Prop([String])
  attachments: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ProposalSchema = SchemaFactory.createForClass(Proposal);