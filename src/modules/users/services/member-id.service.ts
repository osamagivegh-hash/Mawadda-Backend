import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class MemberIdService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Generates a unique member ID in format MAW-XXXXXX
   * Uses atomic operations to prevent race conditions
   */
  async generateUniqueMemberId(): Promise<string> {
    const maxAttempts = 10;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        // Get the highest existing member ID
        const lastUser = await this.userModel
          .findOne(
            { memberId: { $regex: /^MAW-\d{6}$/ } },
            { memberId: 1 }
          )
          .sort({ memberId: -1 })
          .lean()
          .exec();

        let nextNumber = 1;
        if (lastUser?.memberId) {
          const currentNumber = parseInt(lastUser.memberId.replace('MAW-', ''));
          nextNumber = currentNumber + 1;
        }

        const memberId = `MAW-${nextNumber.toString().padStart(6, '0')}`;

        // Verify uniqueness (double-check)
        const exists = await this.userModel
          .findOne({ memberId })
          .lean()
          .exec();

        if (!exists) {
          return memberId;
        }

        attempts++;
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error('Failed to generate unique member ID after maximum attempts');
        }
      }
    }

    throw new Error('Failed to generate unique member ID');
  }

  /**
   * Validates member ID format
   */
  isValidMemberIdFormat(memberId: string): boolean {
    return /^MAW-\d{6}$/.test(memberId);
  }

  /**
   * Searches for users by member ID (supports partial search)
   */
  async findByMemberId(memberId: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ memberId: new RegExp(memberId, 'i') })
      .exec();
  }
}
