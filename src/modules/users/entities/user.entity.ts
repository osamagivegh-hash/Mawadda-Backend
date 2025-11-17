import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

export enum UserRole {
  USER = 'user',
  CONSULTANT = 'consultant',
  ADMIN = 'admin',
  SUPER_ADMIN = 'superAdmin',
}

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ unique: true, type: 'varchar', length: 50, name: 'member_id' })
  memberId: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'phone_number' })
  phoneNumber?: string;

  @Column({ nullable: true, name: 'profile_id' })
  profileId?: number;

  @OneToOne(() => Profile, (profile) => profile.user, { nullable: true })
  @JoinColumn({ name: 'profile_id' })
  profile?: Profile;

  @Column({ default: 'basic', type: 'varchar', length: 50, name: 'membership_plan_id' })
  membershipPlanId: string;

  @Column({ type: 'datetime', nullable: true, name: 'membership_expires_at' })
  membershipExpiresAt?: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'pending_membership_upgrade' })
  pendingMembershipUpgrade?: string;

  @Column({ type: 'datetime', nullable: true, name: 'pending_membership_upgrade_at' })
  pendingMembershipUpgradeAt?: Date;

  @Column({ type: 'json', nullable: true, name: 'purchased_exams' })
  purchasedExams?: string[];

  @Column({ default: false, type: 'boolean', name: 'has_purchased_exam' })
  hasPurchasedExam: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


