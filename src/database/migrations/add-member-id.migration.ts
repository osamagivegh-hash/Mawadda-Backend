import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../modules/users/schemas/user.schema';

@Injectable()
export class AddMemberIdMigration {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async run(): Promise<void> {
    console.log('🔄 Starting memberId migration...');

    try {
      // Find all users without memberId
      const usersWithoutMemberId = await this.userModel
        .find({ memberId: { $exists: false } })
        .exec();

      if (usersWithoutMemberId.length === 0) {
        console.log('✅ All users already have memberIds');
        return;
      }

      console.log(`📊 Found ${usersWithoutMemberId.length} users without memberId`);

      // Get the highest existing memberId to continue sequence
      const lastUserWithId = await this.userModel
        .findOne(
          { memberId: { $regex: /^MAW-\d{6}$/ } },
          { memberId: 1 }
        )
        .sort({ memberId: -1 })
        .lean()
        .exec();

      let nextNumber = 1;
      if (lastUserWithId?.memberId) {
        const currentNumber = parseInt(lastUserWithId.memberId.replace('MAW-', ''));
        nextNumber = currentNumber + 1;
      }

      // Update users in batches
      const batchSize = 100;
      for (let i = 0; i < usersWithoutMemberId.length; i += batchSize) {
        const batch = usersWithoutMemberId.slice(i, i + batchSize);
        
        const bulkOps = batch.map((user, index) => {
          const memberIdNumber = nextNumber + i + index;
          const memberId = `MAW-${memberIdNumber.toString().padStart(6, '0')}`;
          
          return {
            updateOne: {
              filter: { _id: user._id },
              update: { $set: { memberId } }
            }
          };
        });

        await this.userModel.bulkWrite(bulkOps);
        console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersWithoutMemberId.length / batchSize)}`);
      }

      console.log('✅ MemberId migration completed successfully');
    } catch (error) {
      console.error('❌ MemberId migration failed:', error);
      throw error;
    }
  }

  async rollback(): Promise<void> {
    console.log('🔄 Rolling back memberId migration...');
    
    try {
      await this.userModel.updateMany(
        { memberId: { $regex: /^MAW-\d{6}$/ } },
        { $unset: { memberId: 1 } }
      );
      
      console.log('✅ MemberId migration rollback completed');
    } catch (error) {
      console.error('❌ MemberId migration rollback failed:', error);
      throw error;
    }
  }
}
