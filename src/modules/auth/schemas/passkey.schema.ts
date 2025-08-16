import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PasskeyDocument = Passkey & Document;

@Schema({ timestamps: true })
export class Passkey {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  credentialId: string;

  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true })
  counter: number;

  @Prop()
  deviceName: string;

  @Prop()
  deviceType: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: null })
  lastUsed: Date;

  @Prop()
  aaguid: string;

  @Prop()
  userAgent: string;
}

export const PasskeySchema = SchemaFactory.createForClass(Passkey);

// Create indexes
PasskeySchema.index({ userId: 1 });
PasskeySchema.index({ credentialId: 1 });
