import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Document } from 'mongoose';

@Schema({ timestamps: true })
export class Client extends Document {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  userId: MongooseSchema.Types.ObjectId;

  @Prop()
  companyName: string;

  @Prop()
  industry: string;

  @Prop()
  website: string;

  @Prop()
  description: string;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  completedProjects: number;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
