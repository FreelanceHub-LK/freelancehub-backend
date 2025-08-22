import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole as User } from '../../users/schemas/user.schema';
import { Category } from '../../categories/schemas/category.schema';
import { Skill } from '../../skills/schemas/skill.schema';

export enum ProjectStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum BudgetType {
  FIXED = 'fixed',
  HOURLY = 'hourly',
}

export type ProjectDocument = Project & Document;

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
export class Project {
  @ApiProperty({ description: 'Project title' })
  @Prop({ required: true, trim: true, maxlength: 255 })
  title: string;

  @ApiProperty({ description: 'Project description' })
  @Prop({ required: true, maxlength: 10000 })
  description: string;

  @ApiProperty({ description: 'Client who posted the project' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  client: User;

  @ApiProperty({ description: 'Project category' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true })
  category: Category;

  @ApiProperty({ description: 'Required skills for the project' })
  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }])
  requiredSkills: Skill[];

  @ApiProperty({ 
    description: 'Budget type',
    enum: BudgetType
  })
  @Prop({ 
    type: String, 
    enum: Object.values(BudgetType), 
    required: true,
    default: BudgetType.FIXED
  })
  budgetType: BudgetType;

  @ApiProperty({ description: 'Budget amount in the specified currency' })
  @Prop({ required: true, min: 0 })
  budgetAmount: number;

  @ApiProperty({ description: 'Currency code (e.g., LKR, USD)' })
  @Prop({ required: true, default: 'LKR', maxlength: 3 })
  currency: string;

  @ApiProperty({ description: 'Project deadline' })
  @Prop()
  deadline: Date;

  @ApiProperty({ 
    description: 'Project status',
    enum: ProjectStatus
  })
  @Prop({ 
    type: String, 
    enum: Object.values(ProjectStatus), 
    default: ProjectStatus.DRAFT 
  })
  status: ProjectStatus;

  @ApiProperty({ description: 'Project attachments' })
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

  @ApiProperty({ description: 'Total number of proposals received' })
  @Prop({ default: 0, min: 0 })
  proposalCount: number;

  @ApiProperty({ description: 'Competition level based on proposal count' })
  @Prop({ 
    type: String, 
    enum: ['low', 'medium', 'high'], 
    default: 'low' 
  })
  competitionLevel: string;

  @ApiProperty({ description: 'Whether the project is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Project creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Project update timestamp' })
  updatedAt: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Indexes for better query performance
ProjectSchema.index({ client: 1 });
ProjectSchema.index({ category: 1 });
ProjectSchema.index({ requiredSkills: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ budgetType: 1 });
ProjectSchema.index({ budgetAmount: 1 });
ProjectSchema.index({ createdAt: -1 });
ProjectSchema.index({ deadline: 1 });
ProjectSchema.index({ 
  title: 'text', 
  description: 'text' 
});

// Middleware to update proposal count
ProjectSchema.pre('save', function(next) {
  if (this.proposalCount >= 20) {
    this.competitionLevel = 'high';
  } else if (this.proposalCount >= 8) {
    this.competitionLevel = 'medium';
  } else {
    this.competitionLevel = 'low';
  }
  next();
});