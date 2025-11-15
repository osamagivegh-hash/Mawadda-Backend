import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConsultationDocument = HydratedDocument<Consultation>;

export enum ConsultationStatus {
  REQUESTED = 'requested',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_, ret: Record<string, unknown>) => {
      if (ret._id) {
        ret.id = (ret._id as Types.ObjectId).toString();
        delete ret._id;
      }
      return ret;
    },
  },
})
export class Consultation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  member: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  consultant: Types.ObjectId;

  @Prop({ type: Date, required: true })
  scheduledAt: Date;

  @Prop({
    type: String,
    enum: Object.values(ConsultationStatus),
    default: ConsultationStatus.REQUESTED,
  })
  status: ConsultationStatus;

  @Prop()
  topic?: string;

  @Prop()
  notes?: string;
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);
