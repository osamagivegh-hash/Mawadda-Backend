import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PreferenceDocument = HydratedDocument<Preference>;

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
export class Preference {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true })
  user: Types.ObjectId;

  @Prop()
  gender?: string;

  @Prop()
  minAge?: number;

  @Prop()
  maxAge?: number;

  @Prop()
  nationality?: string;

  @Prop()
  city?: string;

  @Prop()
  religiosityLevel?: string;

  @Prop()
  maritalStatus?: string;

  @Prop()
  tribe?: string;
}

export const PreferenceSchema = SchemaFactory.createForClass(Preference);
