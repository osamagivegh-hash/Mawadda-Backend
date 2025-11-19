/**
 * Activate All Users Script
 * 
 * This script sets all users to ACTIVE status so they appear in search results.
 * 
 * Run: npx ts-node src/database/seeds/activate-users.ts
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { User, UserDocument, UserStatus } from '../../modules/users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { INestApplicationContext } from '@nestjs/common';

async function activateUsers(app: INestApplicationContext) {
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));

  console.log('\n========== ACTIVATING ALL USERS ==========\n');

  try {
    // Update all users to ACTIVE status
    const result = await userModel.updateMany(
      {},
      { $set: { status: UserStatus.ACTIVE } }
    ).exec();

    console.log(`✅ Updated ${result.modifiedCount} users to ACTIVE status`);
    console.log(`   Total users matched: ${result.matchedCount}`);

    // Show statistics
    const totalUsers = await userModel.countDocuments();
    const activeUsers = await userModel.countDocuments({ status: UserStatus.ACTIVE });
    const inactiveUsers = await userModel.countDocuments({ status: { $ne: UserStatus.ACTIVE } });

    console.log('\n========== USER STATISTICS ==========');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Active users: ${activeUsers}`);
    console.log(`Inactive users: ${inactiveUsers}`);
    console.log('=====================================\n');

  } catch (error) {
    console.error('❌ Error activating users:', error);
    throw error;
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    await activateUsers(app);
    console.log('✅ User activation completed successfully!');
  } catch (error) {
    console.error('❌ Activation failed:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run if executed directly
if (require.main === module) {
  bootstrap().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { activateUsers };

