import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from '../profiles/schemas/profile.schema';
import { SearchMembersDto } from './dto/search-members.dto';
import { User, UserStatus, UserDocument } from '../users/schemas/user.schema';

type SearchResult = {
  user: {
    id: string;
    email: string;
    role: string;
    status: UserStatus;
    memberId: string;
  };
  profile: Partial<Profile> & { 
    id: string;
    age?: number;
  };
};

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Normalize gender values to standard English format
   * Converts Arabic values, corrupted values, and various formats to "male" or "female"
   */
  private normalizeGender(gender: string | null | undefined): string | null {
    if (!gender) return null;
    
    const trimmed = gender.trim().toLowerCase();
    
    // Map Arabic values to English
    const arabicToEnglish: Record<string, string> = {
      'أنثى': 'female',
      'أنثي': 'female', // variant with different diacritics
      'ذكر': 'male',
      'ذكور': 'male',
    };
    
    // Direct match for Arabic
    if (arabicToEnglish[trimmed]) {
      return arabicToEnglish[trimmed];
    }
    
    // Handle corrupted values - check if it starts with "mal" or "fem"
    if (trimmed.startsWith('mal') || trimmed.includes('mal')) {
      return 'male';
    }
    if (trimmed.startsWith('fem') || trimmed.includes('fem')) {
      return 'female';
    }
    
    // Direct English values
    if (trimmed === 'male' || trimmed === 'm') {
      return 'male';
    }
    if (trimmed === 'female' || trimmed === 'f') {
      return 'female';
    }
    
    // If we can't normalize, return null
    return null;
  }

  /**
   * Normalize input gender from user (accepts both English and Arabic)
   */
  private normalizeInputGender(gender: string): string {
    const normalized = this.normalizeGender(gender);
    if (!normalized) {
      throw new BadRequestException(`Invalid gender value: "${gender}". Must be "male", "female", "ذكر", or "أنثى"`);
    }
    return normalized;
  }

  /**
   * Debug method to check database content
   */
  async debugProfiles() {
    try {
      const profileCount = await this.profileModel.countDocuments();
      const userCount = await this.userModel.countDocuments();
      const activeUserCount = await this.userModel.countDocuments({ status: UserStatus.ACTIVE });
      
      // Get sample profiles with actual values
      const sampleProfiles = await this.profileModel.find({}).limit(5).lean();
      const sampleUsers = await this.userModel.find({}).limit(5).lean();
      
      // Check actual gender values in profiles
      const genderValues = await this.profileModel.distinct('gender');
      const statusValues = await this.userModel.distinct('status');
      
      return {
        counts: { 
          profiles: profileCount, 
          users: userCount, 
          activeUsers: activeUserCount 
        },
        sampleProfiles,
        sampleUsers,
        actualGenderValues: genderValues,
        actualStatusValues: statusValues
      };
    } catch (error) {
      console.error('Debug error:', error);
      return { error: error.message };
    }
  }

  async searchMembers(
    filters: SearchMembersDto,
    excludeUserId?: string,
  ): Promise<SearchResult[]> {
    console.log('\n========== SEARCH START ==========');
    console.log('Raw filters received:', JSON.stringify(filters, null, 2));
    console.log('Exclude user ID:', excludeUserId);
    
    try {
      // Validate required fields
      if (!filters.gender) {
        console.log('⚠️ VALIDATION: Gender is required but not provided');
        throw new BadRequestException('Gender is required for search');
      }

      if (!filters.minAge && !filters.maxAge) {
        console.log('⚠️ VALIDATION: Age range is required but not provided');
        throw new BadRequestException('Age range (minAge or maxAge) is required for search');
      }

      // Normalize input gender
      const normalizedGender = this.normalizeInputGender(filters.gender);
      console.log(`Gender normalization: "${filters.gender}" → "${normalizedGender}"`);

      // Build simple profile filter (no aggregation pipeline)
      const profileFilter: Record<string, unknown> = {
        gender: normalizedGender,
      };

      // Convert age range to dateOfBirth range
      // minAge=19, maxAge=43 means:
      // - born between (today - 43 years) and (today - 19 years)
      const today = new Date();
      const dobRange: Record<string, Date> = {};

      if (filters.maxAge !== undefined) {
        // maxAge=43 → must be born after (today - 43 years)
        const minDob = new Date(today);
        minDob.setFullYear(minDob.getFullYear() - filters.maxAge);
        dobRange.$gte = minDob;
      }

      if (filters.minAge !== undefined) {
        // minAge=19 → must be born before (today - 19 years)
        const maxDob = new Date(today);
        maxDob.setFullYear(maxDob.getFullYear() - filters.minAge);
        dobRange.$lte = maxDob;
      }

      if (Object.keys(dobRange).length > 0) {
        profileFilter.dateOfBirth = dobRange;
      }

      console.log(`Age range: minAge=${filters.minAge}, maxAge=${filters.maxAge}`);
      console.log(`DOB range: ${JSON.stringify(dobRange)}`);

      // Add optional filters only if provided and not empty
      const addIfPresent = (key: keyof SearchMembersDto, field: string) => {
        const value = (filters[key] as string | undefined)?.trim();
        if (value && value.toLowerCase() !== 'all' && value.length > 0) {
          profileFilter[field] = value;
        }
      };

      addIfPresent('city', 'city');
      addIfPresent('nationality', 'nationality');
      addIfPresent('education', 'education');
      addIfPresent('occupation', 'occupation');
      addIfPresent('maritalStatus', 'maritalStatus');
      addIfPresent('countryOfResidence', 'countryOfResidence');
      addIfPresent('religion', 'religion');
      addIfPresent('religiosityLevel', 'religiosityLevel');
      addIfPresent('marriageType', 'marriageType');
      addIfPresent('polygamyAcceptance', 'polygamyAcceptance');
      addIfPresent('compatibilityTest', 'compatibilityTest');

      if (filters.height !== undefined && filters.height > 0) {
        profileFilter.height = filters.height;
        console.log(`Adding height filter: ${filters.height}`);
      }

      if (filters.hasPhoto === 'true') {
        profileFilter.photoUrl = { $exists: true, $nin: [null, ''] };
        console.log('Adding hasPhoto filter: true');
      }

      if (filters.keyword && filters.keyword.trim().length > 0) {
        const keyword = filters.keyword.trim();
        profileFilter.$or = [
          { firstName: { $regex: keyword, $options: 'i' } },
          { lastName: { $regex: keyword, $options: 'i' } },
          { about: { $regex: keyword, $options: 'i' } },
          { city: { $regex: keyword, $options: 'i' } },
          { nationality: { $regex: keyword, $options: 'i' } },
        ];
        console.log(`Adding keyword filter: "${keyword}"`);
      }

      console.log('SEARCH PROFILE FILTER:', JSON.stringify(profileFilter, null, 2));

      // Query profiles directly
      const profiles = await this.profileModel.find(profileFilter).lean().exec();
      console.log(`Found ${profiles.length} matching profiles`);

      if (profiles.length === 0) {
        console.log('No profiles match the filter criteria');
        return [];
      }

      // Get user IDs from profiles
      const userIds = profiles
        .map(p => p.user)
        .filter((id): id is Types.ObjectId => !!id)
        .map(id => id.toString());

      const uniqueUserIds = [...new Set(userIds)];
      console.log(`Looking up ${uniqueUserIds.length} unique users`);

      // Build user query (active users only, exclude current user)
      const userQuery: any = {
        _id: { $in: uniqueUserIds.map(id => new Types.ObjectId(id)) },
        status: UserStatus.ACTIVE,
      };

      if (excludeUserId && Types.ObjectId.isValid(excludeUserId)) {
        userQuery._id = { 
          ...userQuery._id,
          $ne: new Types.ObjectId(excludeUserId) 
        };
      }

      console.log('USER QUERY:', JSON.stringify(userQuery, null, 2));

      const users = await this.userModel.find(userQuery).lean().exec();
      console.log(`Found ${users.length} active users`);

      // Create user lookup map
      const userMap = new Map<string, any>();
      users.forEach(u => userMap.set(u._id.toString(), u));

      // Build results and compute age in TypeScript
      const now = new Date();
      const results: SearchResult[] = profiles
        .map(p => {
          const userDoc = userMap.get(p.user?.toString() ?? '');
          if (!userDoc) {
            console.log(`Skipping profile ${p._id} - user not found or not active`);
            return null;
          }

          // Calculate age from dateOfBirth
          const dob = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
          let age: number | undefined = undefined;
          if (dob && !isNaN(dob.getTime())) {
            age = now.getFullYear() - dob.getFullYear();
            // Adjust for birthday not yet passed this year
            const monthDiff = now.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
              age--;
            }
          }

          return {
            user: {
              id: userDoc._id.toString(),
              email: userDoc.email,
              role: userDoc.role,
              status: userDoc.status,
              memberId: userDoc.memberId,
            },
            profile: {
              id: p._id.toString(),
              firstName: p.firstName,
              lastName: p.lastName,
              gender: p.gender,
              age,
              nationality: p.nationality,
              city: p.city,
              countryOfResidence: p.countryOfResidence,
              education: p.education,
              occupation: p.occupation,
              maritalStatus: p.maritalStatus,
              marriageType: p.marriageType,
              polygamyAcceptance: p.polygamyAcceptance,
              compatibilityTest: p.compatibilityTest,
              religion: p.religion,
              religiosityLevel: p.religiosityLevel,
              about: p.about,
              photoUrl: p.photoUrl,
              dateOfBirth: p.dateOfBirth,
              height: p.height,
            },
          };
        })
        .filter((r) => r !== null) as SearchResult[];

      console.log(`SEARCH RESULTS COUNT: ${results.length}`);
      console.log('========== SEARCH END ==========\n');

      return results;

    } catch (error) {
      console.error('\n========== SEARCH ERROR ==========');
      console.error('Error:', error);
      console.error('Stack:', error.stack);
      console.error('===================================\n');
      
      // Re-throw BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      return [];
    }
  }
}