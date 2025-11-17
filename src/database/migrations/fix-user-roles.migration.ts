/**
 * Migration: Fix User Roles
 * 
 * This migration fixes incorrect role values in the users collection.
 * 
 * Problem: Some users have role="male" or role="female" which is incorrect.
 * Solution: Set all users with role="male" or role="female" to role="user"
 * 
 * Run this migration with:
 * npm run migration:run fix-user-roles
 */

import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class FixUserRolesMigration {
  constructor(@InjectConnection() private connection: Connection) {}

  async up() {
    const db = this.connection.db;
    const usersCollection = db.collection('users');

    console.log('Starting migration: Fix User Roles');
    
    // Fix incorrect role values
    const result = await usersCollection.updateMany(
      { role: { $in: ['male', 'female'] } },
      { $set: { role: 'user' } }
    );

    console.log(`Updated ${result.modifiedCount} users with incorrect role values`);
    
    // Also set all users to ACTIVE status
    const statusResult = await usersCollection.updateMany(
      { status: { $ne: 'active' } },
      { $set: { status: 'active' } }
    );

    console.log(`Updated ${statusResult.modifiedCount} users to ACTIVE status`);
    
    return {
      rolesFixed: result.modifiedCount,
      statusUpdated: statusResult.modifiedCount,
    };
  }

  async down() {
    // This migration is not reversible
    console.log('Migration fix-user-roles cannot be reversed');
    return { message: 'Migration cannot be reversed' };
  }
}

