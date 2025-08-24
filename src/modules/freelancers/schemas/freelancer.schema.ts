import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type FreelancerDocument = Freelancer & Document;

@Schema({ timestamps: true })
export class Freelancer {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  skills: string[];

  @Prop()
  hourlyRate: number;

  @Prop()
  education: string;

  @Prop()
  isAvailable: boolean;

  @Prop({ type: [String], default: [] })
  certifications: string[];

  @Prop({ type: [String], default: [] })
  portfolioLinks: string[];

  @Prop({ default: 0 })
  completedProjects: number;
}

export const FreelancerSchema = SchemaFactory.createForClass(Freelancer);
