import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  User,
  UserDocument,
  UserRole,
  UserStatus,
} from './schemas/user.schema';
import { MemberIdService } from './services/member-id.service';

export type SafeUser = Omit<
  User & { id: string; createdAt: Date; updatedAt: Date },
  'password'
>;

@Injectable()
export class UsersService {
  private readonly saltRounds: number;

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly memberIdService: MemberIdService,
    configService: ConfigService,
  ) {
    this.saltRounds = configService.get<number>('auth.bcryptSaltRounds', 10);
  }

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const passwordHash = await bcrypt.hash(
      createUserDto.password,
      this.saltRounds,
    );
    
    // Generate unique member ID
    const memberId = await this.memberIdService.generateUniqueMemberId();
    
    const created = await this.userModel.create({
      ...createUserDto,
      password: passwordHash,
      memberId,
      status:
        createUserDto.role === UserRole.ADMIN
          ? UserStatus.ACTIVE
          : UserStatus.PENDING,
    });
    return this.sanitizeUser(created);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.userModel.find().lean().exec();
    return users.map((user) => this.sanitizeUser(user));
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  findByMemberId(memberId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ memberId }).exec();
  }

  async findOne(id: string): Promise<SafeUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const user = await this.userModel.findById(id).lean().exec();
    return user ? this.sanitizeUser(user) : null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    const update: Partial<User> & { password?: string } = {
      ...updateUserDto,
    };

    if (updateUserDto.password) {
      update.password = await bcrypt.hash(
        updateUserDto.password,
        this.saltRounds,
      );
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      })
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('User not found');
    }
  }

  async updateMembership(
    id: string,
    planId: string,
    expiresAt: Date | null,
  ): Promise<SafeUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            membershipPlanId: planId,
            membershipExpiresAt: expiresAt,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Sets pending membership upgrade for payment verification
   */
  async setPendingMembershipUpgrade(id: string, planId: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            pendingMembershipUpgrade: planId,
            pendingMembershipUpgradeAt: new Date(),
          },
        },
      )
      .exec();
  }

  /**
   * Clears pending membership upgrade after successful payment
   */
  async clearPendingMembershipUpgrade(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $unset: {
            pendingMembershipUpgrade: 1,
            pendingMembershipUpgradeAt: 1,
          },
        },
      )
      .exec();
  }

  /**
   * Sets exam purchase status after successful payment
   */
  async setExamPurchased(id: string, examId: string): Promise<SafeUser> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $addToSet: {
            purchasedExams: examId,
          },
          $set: {
            hasPurchasedExam: true,
          },
        },
        { new: true },
      )
      .lean()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  /**
   * Checks if user has purchased a specific exam
   */
  async hasExamAccess(id: string, examId: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) {
      return false;
    }

    const user = await this.userModel
      .findById(id, { purchasedExams: 1 })
      .lean()
      .exec();

    return user?.purchasedExams?.includes(examId) ?? false;
  }

  sanitizeUser(
    user:
      | (UserDocument & { toObject: () => Record<string, unknown> })
      | (Record<string, unknown> & { _id?: Types.ObjectId })
      | SafeUser,
  ): SafeUser {
    if (user && typeof (user as UserDocument).toObject === 'function') {
      const plain = (user as UserDocument).toObject({
        virtuals: true,
        versionKey: false,
        getters: true,
      }) as Record<string, unknown>;
      return this.sanitizeUser(plain);
    }

    const record = user as Record<string, unknown> & {
      password?: string;
      _id?: Types.ObjectId;
      id?: string;
      createdAt?: Date;
      updatedAt?: Date;
      role?: UserRole;
      status?: UserStatus;
      email?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _unusedPassword, _id, ...rest } = record;

    return {
      ...(rest as SafeUser),
      id: (rest as SafeUser).id ?? record.id ?? _id?.toString() ?? '',
    };
  }
}
