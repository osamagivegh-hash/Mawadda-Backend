import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  GENDERS,
  RELIGIONS,
  RELIGIOSITY_LEVELS,
  MARITAL_STATUSES,
  MARRIAGE_TYPES,
  POLYGAMY_OPTIONS,
  CompatibilityOption,
} from '../profile-options';

export type ProfileDocument = HydratedDocument<Profile>;

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
export class Profile {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true, required: true })
  user: Types.ObjectId;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({
    type: String,
    required: true,
    enum: GENDERS,
    trim: true,
  })
  gender: string;

  @Prop({ type: Date, required: true })
  dateOfBirth: Date;

  @Prop({ type: String, required: true })
  nationality: string;

  @Prop({ type: String, required: true })
  city: string;

  @Prop({ type: Number, min: 0 })
  height?: number;

  @Prop({ type: String, required: true })
  education: string;

  @Prop({ type: String, required: true })
  occupation: string;

  @Prop({ type: String, required: true })
  religiosityLevel: string;

  @Prop()
  religion?: string;

  @Prop({ type: String, required: true, enum: MARITAL_STATUSES })
  maritalStatus: string;

  @Prop({ type: String, enum: MARRIAGE_TYPES })
  marriageType?: string;

  @Prop({ type: String, enum: POLYGAMY_OPTIONS })
  polygamyAcceptance?: string;

  @Prop({ type: String })
  compatibilityTest?: CompatibilityOption;

  @Prop()
  countryOfResidence?: string;

  @Prop()
  about?: string;

  @Prop()
  guardianName?: string;

  @Prop()
  guardianContact?: string;

  @Prop()
  photoUrl?: string;

  @Prop({ enum: ['cloudinary', 'local'], default: 'cloudinary' })
  photoStorage?: 'cloudinary' | 'local';

  @Prop()
  photoPublicId?: string | null;

  @Prop({ default: false })
  isVerified: boolean;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Indexes for fast search on structured fields
ProfileSchema.index({ gender: 1 });
ProfileSchema.index({ nationality: 1 });
ProfileSchema.index({ city: 1 });
ProfileSchema.index({ countryOfResidence: 1 });
ProfileSchema.index({ education: 1 });
ProfileSchema.index({ occupation: 1 });
ProfileSchema.index({ religiosityLevel: 1 });
ProfileSchema.index({ religion: 1 });
ProfileSchema.index({ maritalStatus: 1 });
ProfileSchema.index({ marriageType: 1 });
ProfileSchema.index({ polygamyAcceptance: 1 });
ProfileSchema.index({ compatibilityTest: 1 });
ProfileSchema.index({ dateOfBirth: 1 });
