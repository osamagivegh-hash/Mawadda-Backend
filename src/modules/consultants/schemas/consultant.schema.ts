import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ConsultantDocument = Consultant & Document;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
  },
})
export class Consultant {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  title?: string;

  @Prop({ trim: true })
  specialization?: string;

  @Prop({ trim: true })
  bio?: string;

  @Prop({ trim: true })
  avatarUrl?: string;

  @Prop({ type: [String], default: [] })
  languages?: string[];

  @Prop({ default: 0 })
  yearsExperience?: number;

  @Prop({
    type: String,
    enum: ['male', 'female', 'mixed'],
    default: 'mixed',
  })
  gender: 'male' | 'female' | 'mixed';

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  rating?: number;
}

export const ConsultantSchema = SchemaFactory.createForClass(Consultant);




