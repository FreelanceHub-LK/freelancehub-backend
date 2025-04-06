import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { UserRole as User } from '../../users/schemas/user.schema';
import { Category } from '../../categories/schemas/category.schema';
import { Skill } from '../../skills/schemas/skill.schema';

export enum ProjectStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  client: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true })
  category: Category;

  @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }])
  requiredSkills: Skill[];

  @Prop({ required: true })
  budget: number;

  @Prop()
  deadline: Date;

  @Prop({ 
    type: String, 
    enum: Object.values(ProjectStatus), 
    default: ProjectStatus.DRAFT 
  })
  status: ProjectStatus;

  @Prop([String])
  attachments: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);