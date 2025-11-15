import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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
    enum: ['male', 'female'],
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

  @Prop({ type: String, required: true })
  maritalStatus: string;

  @Prop()
  marriageType?: string;

  @Prop()
  polygamyAcceptance?: string;

  @Prop()
  compatibilityTest?: string;

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
