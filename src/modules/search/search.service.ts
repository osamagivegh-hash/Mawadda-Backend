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

  // Gender normalization methods removed - gender is now automatically determined
  // from the logged-in user's profile (male users search for females, female users search for males)

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
    try {
      // Validate required fields
      if (!filters.minAge && !filters.maxAge) {
        throw new BadRequestException('Age range (minAge or maxAge) is required for search');
      }

      // Validate user ID
      if (!excludeUserId || !Types.ObjectId.isValid(excludeUserId)) {
        throw new BadRequestException('User ID is required to determine search gender');
      }

      // Fetch current user's profile to determine target gender
      // ALL gender logic MUST come from profiles.gender, NEVER from users.role
      const myProfile = await this.profileModel
        .findOne({ user: new Types.ObjectId(excludeUserId) })
        .lean()
        .exec();

      if (!myProfile || !myProfile.gender) {
        throw new BadRequestException('User profile missing gender. Please complete your profile first.');
      }

      // Determine target gender: male → female, female → male
      const targetGender = myProfile.gender === 'male' ? 'female' : 'male';
      
      console.log('TARGET GENDER:', targetGender);

      // Build simple profile filter - ONLY use Profile model fields
      const profileFilter: any = {
        gender: targetGender,
      };

      // Calculate dateOfBirth range from age filters
      const today = new Date();
      const dobRange: any = {};

      if (filters.maxAge !== undefined) {
        const minDOB = new Date(today);
        minDOB.setFullYear(minDOB.getFullYear() - filters.maxAge);
        minDOB.setHours(0, 0, 0, 0);
        dobRange.$gte = minDOB;
      }

      if (filters.minAge !== undefined) {
        const maxDOB = new Date(today);
        maxDOB.setFullYear(maxDOB.getFullYear() - filters.minAge);
        maxDOB.setHours(23, 59, 59, 999);
        dobRange.$lte = maxDOB;
      }

      if (Object.keys(dobRange).length > 0) {
        profileFilter.dateOfBirth = dobRange;
      }

      // Add optional exact-match filters
      const addIfPresent = (key: string, field: string) => {
        const val = (filters as any)[key];
        if (val && val !== 'all' && val !== '') {
          profileFilter[field] = val;
        }
      };

      addIfPresent('city', 'city');
      addIfPresent('nationality', 'nationality');
      addIfPresent('education', 'education');
      addIfPresent('occupation', 'occupation');
      addIfPresent('religiosityLevel', 'religiosityLevel');
      addIfPresent('maritalStatus', 'maritalStatus');
      addIfPresent('countryOfResidence', 'countryOfResidence');
      addIfPresent('marriageType', 'marriageType');
      addIfPresent('polygamyAcceptance', 'polygamyAcceptance');
      addIfPresent('compatibilityTest', 'compatibilityTest');

      if (filters.height !== undefined && filters.height > 0) {
        profileFilter.height = filters.height;
      }

      if (filters.hasPhoto === 'true') {
        profileFilter.photoUrl = { $exists: true, $nin: [null, ''] };
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
      }

      console.log('FINAL PROFILE FILTER:', JSON.stringify(profileFilter, null, 2));

      // Simple Profile.find() query - no aggregation, no pipelines
      const profiles = await this.profileModel.find(profileFilter).lean().exec();
      console.log(`Found ${profiles.length} profiles matching all filters`);

      if (profiles.length === 0) {
        return [];
      }

      // Get unique user IDs from profiles (exclude current user)
      const userIds = [...new Set(
        profiles
          .map(p => p.user?.toString())
          .filter((id): id is string => 
            !!id && 
            Types.ObjectId.isValid(id) && 
            id !== excludeUserId
          )
      )];

      if (userIds.length === 0) {
        return [];
      }

      // Fetch active users - ONLY after matching profiles
      const userObjectIds = userIds.map(id => new Types.ObjectId(id));
      const users = await this.userModel
        .find({
          _id: { $in: userObjectIds },
          status: UserStatus.ACTIVE,
        })
        .lean()
        .exec();

      // Create user lookup map
      const userMap = new Map<string, any>();
      users.forEach(u => userMap.set(u._id.toString(), u));

      // Build results and calculate age
      const now = new Date();
      const results: SearchResult[] = [];
      
      for (const p of profiles) {
        const userId = p.user?.toString();
        const userDoc = userId ? userMap.get(userId) : null;
        
        if (!userDoc) {
          continue; // Skip if user not found or not active
        }

        // Calculate age from dateOfBirth
        const dob = p.dateOfBirth ? new Date(p.dateOfBirth) : null;
        let age: number | undefined = undefined;
        if (dob && !isNaN(dob.getTime())) {
          age = now.getFullYear() - dob.getFullYear();
          const monthDiff = now.getMonth() - dob.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
            age--;
          }
        }

        results.push({
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
        });
      }

      console.log(`Returning ${results.length} search results`);
      return results;

    } catch (error) {
      console.error('SEARCH ERROR:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      return [];
    }
  }
}