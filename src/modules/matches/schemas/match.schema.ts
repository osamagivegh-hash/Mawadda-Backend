import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MatchDocument = HydratedDocument<Match>;

export enum MatchStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
  INTRODUCTION_SCHEDULED = 'introduction_scheduled',
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
export class Match {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requester: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  target: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(MatchStatus),
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Prop({ type: Number })
  compatibilityScore?: number;

  @Prop()
  notes?: string;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
