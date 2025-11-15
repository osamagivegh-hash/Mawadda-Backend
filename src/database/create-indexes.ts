import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseIndexService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    await this.createIndexes();
  }

  private async createIndexes() {
    try {
      const db = this.connection.db;

      // User collection indexes
      await db.collection('users').createIndexes([
        { key: { email: 1 }, unique: true },
        { key: { memberId: 1 }, unique: true, sparse: true },
        { key: { status: 1 } },
        { key: { role: 1 } },
        { key: { createdAt: 1 } },
        // Compound index for active users
        { key: { status: 1, role: 1 } },
      ]);

      // Profile collection indexes
      await db.collection('profiles').createIndexes([
        { key: { user: 1 }, unique: true },
        { key: { gender: 1 } },
        { key: { city: 1 } },
        { key: { countryOfResidence: 1 } },
        { key: { nationality: 1 } },
        { key: { education: 1 } },
        { key: { maritalStatus: 1 } },
        { key: { marriageType: 1 } },
        { key: { polygamyAcceptance: 1 } },
        { key: { compatibilityTest: 1 } },
        { key: { religion: 1 } },
        { key: { religiosityLevel: 1 } },
        { key: { dateOfBirth: 1 } },
        { key: { height: 1 } },
        { key: { photoUrl: 1 } },
        // Text index for search functionality
        {
          key: {
            firstName: 'text',
            lastName: 'text',
            guardianName: 'text',
            about: 'text',
            city: 'text',
            nationality: 'text',
            education: 'text',
            countryOfResidence: 'text',
          },
          name: 'profile_text_search',
        },
        // Compound indexes for common search patterns
        { key: { gender: 1, dateOfBirth: 1 } }, // Most common: gender + age
        { key: { gender: 1, city: 1 } },
        { key: { gender: 1, countryOfResidence: 1 } },
        { key: { gender: 1, maritalStatus: 1 } },
        { key: { gender: 1, height: 1 } },
        { key: { city: 1, maritalStatus: 1 } },
        { key: { countryOfResidence: 1, nationality: 1 } },
      ]);

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating database indexes:', error);
    }
  }
}
