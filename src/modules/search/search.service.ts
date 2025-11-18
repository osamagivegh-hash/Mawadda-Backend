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

type SearchResponse = {
  status: string;
  filters_received: SearchMembersDto;
  data: SearchResult[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
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

  async searchMembers(
    filters: SearchMembersDto,
    excludeUserId?: string,
  ): Promise<SearchResponse> {
    console.log('SEARCH FILTER INPUT:', JSON.stringify(filters, null, 2));

    try {
      // Validate user ID
      if (!excludeUserId || !Types.ObjectId.isValid(excludeUserId)) {
        throw new BadRequestException('User ID is required to determine search gender');
      }

      // CRITICAL: Get logged-in user's profile to determine target gender
      // We MUST use profiles.gender, NEVER users.role
      console.log('SEARCH: Looking for profile with user ID:', excludeUserId);
      const userIdObject = new Types.ObjectId(excludeUserId);
      console.log('SEARCH: Converted to ObjectId:', userIdObject.toString());
      
      const myProfile = await this.profileModel
        .findOne({ user: userIdObject })
        .lean()
        .exec();

      console.log('SEARCH: Profile found:', myProfile ? 'YES' : 'NO');
      if (myProfile) {
        console.log('SEARCH: Profile data:', {
          id: myProfile._id?.toString(),
          userId: myProfile.user?.toString(),
          gender: myProfile.gender,
          hasGender: !!myProfile.gender,
        });
      }

      if (!myProfile) {
        throw new BadRequestException(
          'User profile not found. Please complete your profile first by visiting the profile page.',
        );
      }

      if (!myProfile.gender) {
        throw new BadRequestException(
          'User profile missing gender. Please add your gender in the profile page.',
        );
      }

      // Determine opposite gender: male → female, female → male
      const targetGender = myProfile.gender === 'male' ? 'female' : 'male';
      console.log('USING PROFILE GENDER:', myProfile.gender);
      console.log('TARGET GENDER (opposite):', targetGender);
      console.log('NOT USING USER ROLE FOR GENDER');

      // Build profile filter - ONLY use Profile model fields
      const profileFilter: any = {
        gender: targetGender,
      };

      // Calculate dateOfBirth range from age filters (Laravel logic)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dobRange: any = {};

      if (filters.maxAge !== undefined) {
        // maxAge → birthdate >= (today - maxAge years)
        const maxAgeDate = new Date(today);
        maxAgeDate.setFullYear(maxAgeDate.getFullYear() - filters.maxAge);
        dobRange.$gte = maxAgeDate;
      }

      if (filters.minAge !== undefined) {
        // minAge → birthdate <= (today - minAge years)
        const minAgeDate = new Date(today);
        minAgeDate.setFullYear(minAgeDate.getFullYear() - filters.minAge);
        minAgeDate.setHours(23, 59, 59, 999);
        dobRange.$lte = minAgeDate;
      }

      if (Object.keys(dobRange).length > 0) {
        profileFilter.dateOfBirth = dobRange;
      }

      // Height filters
      if (filters.minHeight !== undefined || filters.maxHeight !== undefined) {
        profileFilter.height = {};
        if (filters.minHeight !== undefined) {
          profileFilter.height.$gte = filters.minHeight;
        }
        if (filters.maxHeight !== undefined) {
          profileFilter.height.$lte = filters.maxHeight;
        }
      }

      // Gender-specific marital status mapping
      // Maps gender-inappropriate statuses to correct ones based on target gender
      const normalizeMaritalStatus = (status: string, targetGender: string): string => {
        if (!status || status === 'all' || status === '') {
          return status;
        }

        // Status mappings: female-specific → male-specific and vice versa
        const statusMap: Record<string, { female: string; male: string }> = {
          'عزباء': { female: 'عزباء', male: 'أعزب' },
          'أعزب': { female: 'عزباء', male: 'أعزب' },
          'مطلقة': { female: 'مطلقة', male: 'مطلق' },
          'مطلق': { female: 'مطلقة', male: 'مطلق' },
          'أرملة': { female: 'أرملة', male: 'أرمل' },
          'أرمل': { female: 'أرملة', male: 'أرمل' },
        };

        // For statuses with children info, keep them as-is (they're gender-neutral)
        if (status.includes('بدون أولاد') || status.includes('مع أولاد') || status.includes('منفصل')) {
          return status;
        }

        // Map the status based on target gender
        const mapped = statusMap[status];
        if (mapped) {
          return targetGender === 'female' ? mapped.female : mapped.male;
        }

        // If no mapping found, return as-is (might be a valid gender-neutral status)
        return status;
      };

      // Optional exact-match filters
      const addIfPresent = (key: keyof SearchMembersDto, field: string) => {
        const val = filters[key];
        if (val && val !== 'all' && val !== '') {
          profileFilter[field] = val;
        }
      };

      addIfPresent('city', 'city');
      addIfPresent('nationality', 'nationality');
      addIfPresent('education', 'education');
      addIfPresent('occupation', 'occupation');
      addIfPresent('religiosityLevel', 'religiosityLevel');
      
      // Handle marital status with gender normalization and flexible matching
      if (filters.maritalStatus && filters.maritalStatus !== 'all' && filters.maritalStatus !== '') {
        const originalStatus = filters.maritalStatus;
        const normalizedStatus = normalizeMaritalStatus(originalStatus, targetGender);
        
        // For unmarried status variants, search for both to handle database inconsistencies
        // Database might have "أعزب" for both genders or "عزباء" for females
        if (originalStatus === 'عزباء' || originalStatus === 'أعزب' || 
            normalizedStatus === 'عزباء' || normalizedStatus === 'أعزب') {
          // Search for both variants when looking for unmarried status
          profileFilter.maritalStatus = { $in: ['عزباء', 'أعزب'] };
          console.log(`MARITAL STATUS FLEXIBLE SEARCH (unmarried): "${originalStatus}" → searching for both "عزباء" and "أعزب" (target: ${targetGender})`);
        } 
        // For divorced status variants
        else if (originalStatus === 'مطلقة' || originalStatus === 'مطلق' || 
                 normalizedStatus === 'مطلقة' || normalizedStatus === 'مطلق') {
          // Search for both variants when looking for divorced status
          profileFilter.maritalStatus = { $in: ['مطلقة', 'مطلق'] };
          console.log(`MARITAL STATUS FLEXIBLE SEARCH (divorced): "${originalStatus}" → searching for both "مطلقة" and "مطلق" (target: ${targetGender})`);
        } 
        // For widowed status variants
        else if (originalStatus === 'أرملة' || originalStatus === 'أرمل' || 
                 normalizedStatus === 'أرملة' || normalizedStatus === 'أرمل') {
          // Search for both variants when looking for widowed status
          profileFilter.maritalStatus = { $in: ['أرملة', 'أرمل'] };
          console.log(`MARITAL STATUS FLEXIBLE SEARCH (widowed): "${originalStatus}" → searching for both "أرملة" and "أرمل" (target: ${targetGender})`);
        } 
        // For other statuses (with children info, etc.), use exact match
        else {
          profileFilter.maritalStatus = normalizedStatus;
          console.log(`MARITAL STATUS EXACT MATCH: "${originalStatus}" → "${normalizedStatus}" (target: ${targetGender})`);
        }
      }
      
      addIfPresent('countryOfResidence', 'countryOfResidence');
      addIfPresent('marriageType', 'marriageType');
      addIfPresent('polygamyAcceptance', 'polygamyAcceptance');
      addIfPresent('compatibilityTest', 'compatibilityTest');

      // Photo filter
      if (filters.hasPhoto === 'true') {
        profileFilter.photoUrl = { $exists: true, $nin: [null, ''] };
      }

      // Keyword search (first name, last name, about, city, nationality)
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

      // Member ID search - need to fetch users first and match profile.user
      if (filters.memberId && filters.memberId.trim().length > 0) {
        const usersWithMemberId = await this.userModel
          .find({ memberId: filters.memberId.trim() })
          .select('_id')
          .lean()
          .exec();
        
        const userIdsToMatch = usersWithMemberId
          .map(u => u._id)
          .filter(id => id.toString() !== excludeUserId);
        
        if (userIdsToMatch.length === 0) {
          // No users found with this memberId (excluding current user), return empty result
          return {
            status: 'success',
            filters_received: filters,
            data: [],
            meta: {
              current_page: filters.page ?? 1,
              last_page: 1,
              per_page: filters.per_page ?? 20,
              total: 0,
            },
          };
        }
        profileFilter.user = { $in: userIdsToMatch };
      } else {
        // Exclude current user if no memberId filter
        profileFilter.user = { $ne: new Types.ObjectId(excludeUserId) };
      }

      console.log('FILTERING BY PROFILE.GENDER:', targetGender);
      console.log('NOT FILTERING BY USER.ROLE');
      console.log('FINAL PROFILE FILTER:', JSON.stringify(profileFilter, null, 2));

      // Get total count before pagination
      const total = await this.profileModel.countDocuments(profileFilter);
      console.log('TOTAL RESULTS (before pagination):', total);

      // Pagination
      const page = filters.page ?? 1;
      const perPage = filters.per_page ?? 20;
      const skip = (page - 1) * perPage;

      // Execute query
      const profiles = await this.profileModel
        .find(profileFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean()
        .exec();

      console.log(`FOUND ${profiles.length} PROFILES`);

      // Get unique user IDs from profiles
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
        return {
          status: 'success',
          filters_received: filters,
          data: [],
          meta: {
            current_page: page,
            last_page: 1,
            per_page: perPage,
            total: 0,
          },
        };
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

      // Build results with age calculation
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

      console.log(`RETURNING ${results.length} SEARCH RESULTS`);

      // Calculate pagination meta
      const lastPage = Math.ceil(total / perPage);

      return {
        status: 'success',
        filters_received: filters,
        data: results,
        meta: {
          current_page: page,
          last_page: lastPage,
          per_page: perPage,
          total,
        },
      };
    } catch (error) {
      console.error('SEARCH ERROR:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Search failed. Please try again.');
    }
  }
}
