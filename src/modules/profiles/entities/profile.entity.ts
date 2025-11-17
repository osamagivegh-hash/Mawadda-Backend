import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'first_name' })
  firstName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'last_name' })
  lastName?: string;

  @Column({
    type: 'enum',
    enum: ['male', 'female'],
    nullable: false,
  })
  gender: string;

  @Column({ type: 'date', nullable: false, name: 'date_of_birth' })
  dateOfBirth: Date;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nationality: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  city: string;

  @Column({ type: 'int', nullable: true })
  height?: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  education: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  occupation: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'religiosity_level' })
  religiosityLevel: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  religion?: string;

  @Column({ type: 'varchar', length: 255, nullable: false, name: 'marital_status' })
  maritalStatus: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'marriage_type' })
  marriageType?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'polygamy_acceptance' })
  polygamyAcceptance?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'compatibility_test' })
  compatibilityTest?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'country_of_residence' })
  countryOfResidence?: string;

  @Column({ type: 'text', nullable: true })
  about?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'guardian_name' })
  guardianName?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'guardian_contact' })
  guardianContact?: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'photo_url' })
  photoUrl?: string;

  @Column({
    type: 'enum',
    enum: ['cloudinary', 'local'],
    default: 'cloudinary',
    name: 'photo_storage',
  })
  photoStorage?: 'cloudinary' | 'local';

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'photo_public_id' })
  photoPublicId?: string | null;

  @Column({ type: 'tinyint', default: 0, name: 'is_verified' })
  isVerified: boolean;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
