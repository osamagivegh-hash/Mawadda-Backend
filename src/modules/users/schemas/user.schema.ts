import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  FEMALE = 'female',
  MALE = 'male',
  CONSULTANT = 'consultant',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
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
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ unique: true, trim: true, lowercase: true })
  email: string;

  @Prop()
  password: string;

  @Prop({ unique: true, required: true, index: true })
  memberId: string;

  @Prop({ type: String, enum: Object.values(UserRole) })
  role: UserRole;

  @Prop({
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Prop()
  phoneNumber?: string;

  @Prop({ type: Types.ObjectId, ref: 'Profile' })
  profile?: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Preference' }] })
  preferences?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Match' }] })
  requestedMatches?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Match' }] })
  receivedMatches?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Consultation' }] })
  memberConsultations?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Consultation' }] })
  consultantConsultations?: Types.ObjectId[];

  @Prop({ default: 'basic', trim: true })
  membershipPlanId: string;

  @Prop({ type: Date, default: null })
  membershipExpiresAt?: Date | null;

  // Payment-related fields for membership upgrades
  @Prop({ trim: true })
  pendingMembershipUpgrade?: string;

  @Prop({ type: Date })
  pendingMembershipUpgradeAt?: Date;

  // Exam purchase tracking
  @Prop({ type: [String], default: [] })
  purchasedExams?: string[];

  @Prop({ default: false })
  hasPurchasedExam?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
