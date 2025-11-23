import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from '../profiles/schemas/profile.schema';
import { SearchMembersDto } from './dto/search-members.dto';
import { User, UserStatus, UserDocument } from '../users/schemas/user.schema';
import {
  normalizeMaritalStatusForGender,
  getMaritalStatusesForGender,
  isMaritalStatusValidForGender,
  getMaritalStatusVariants,
} from '../profiles/marital-status-utils';

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

const normalizeGender = (rawGender?: string | null): 'male' | 'female' | undefined => {
  if (!rawGender) return undefined;

  const gender = rawGender.toString().trim().toLowerCase();

  const maleValues = [
    'male',
    'm',
    'ذكر',
    'ذكور',
    'راجل',
    'رجال',
    'malq',
    'مالق',
    'malk',
    'ذكر ',
  ];

  const femaleValues = [
    'female',
    'f',
    'انثى',
    'أنثى',
    'أنثي',
    'انثي',
    'fem',
    'femael',
    'femal',
  ];

  if (maleValues.includes(gender)) return 'male';
  if (femaleValues.includes(gender)) return 'female';

  return undefined;
};

const buildGenderVariants = (targetGender: 'male' | 'female') => {
  const variants =
    targetGender === 'male'
      ? ['male', 'Male', 'MALE', 'ذكر', 'ذكور', 'mal', 'malq', 'مالق']
      : ['female', 'Female', 'FEMALE', 'أنثى', 'انثى', 'أنثي', 'انثي', 'fem', 'femael'];

  // Ensure normalized value is always included for exact matches
  return Array.from(new Set(variants));
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildExactMatchRegex = (value: string) => new RegExp(`^${escapeRegex(value.trim())}$`, 'i');

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
    profileId?: string,
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
      console.log('SEARCH: Profile ID from request:', profileId);
      
      let myProfile = null;
      
      // Method 1: Try to find by profile ID if provided (most reliable)
      if (profileId && Types.ObjectId.isValid(profileId)) {
        console.log('SEARCH: Trying to find profile by profile ID:', profileId);
        myProfile = await this.profileModel
          .findById(new Types.ObjectId(profileId))
          .lean()
          .exec();
        
        if (myProfile) {
          console.log('SEARCH: Found profile by profile ID');
        }
      }
      
      // Method 2: Try to find by user ID
      if (!myProfile) {
        const userIdObject = new Types.ObjectId(excludeUserId);
        console.log('SEARCH: Converted to ObjectId:', userIdObject.toString());
        console.log('SEARCH: Trying to find profile by user ID');
        
        myProfile = await this.profileModel
          .findOne({ user: userIdObject })
          .lean()
          .exec();
        
        if (myProfile) {
          console.log('SEARCH: Found profile by user ID');
        }
      }

      // Method 3: If not found, try alternative search methods
      if (!myProfile) {
        console.log('SEARCH: Profile not found by user ID or profile ID, trying alternative search...');
        
        // Try finding by user field as string
        const allProfiles = await this.profileModel
          .find({})
          .select('_id user gender')
          .lean()
          .exec();
        
        console.log(`SEARCH: Found ${allProfiles.length} total profiles in database`);
        console.log('SEARCH: Searching for user ID:', excludeUserId);
        console.log('SEARCH: Sample profile user IDs:', allProfiles.slice(0, 5).map(p => ({
          profileId: p._id?.toString(),
          userId: p.user?.toString(),
        })));
        
        // Try to find profile where user.toString() matches
        const foundProfile = allProfiles.find(p => {
          if (!p.user) return false;
          const userStr = p.user.toString();
          const excludeStr = excludeUserId.toString();
          return userStr === excludeStr;
        });
        
        if (foundProfile) {
          console.log('SEARCH: Found profile using string comparison method');
          // Fetch full profile
          myProfile = await this.profileModel
            .findById(foundProfile._id)
            .lean()
            .exec();
        }
      }

      console.log('SEARCH: Profile found:', myProfile ? 'YES' : 'NO');
      if (myProfile) {
        console.log('SEARCH: Profile data:', {
          id: myProfile._id?.toString(),
          userId: myProfile.user?.toString(),
          userIdType: typeof myProfile.user,
          gender: myProfile.gender,
          hasGender: !!myProfile.gender,
        });
      } else {
        // Log all profiles for debugging
        const allProfiles = await this.profileModel.find({}).lean().exec();
        console.log('SEARCH: All profiles in database:', allProfiles.map(p => ({
          id: p._id?.toString(),
          userId: p.user?.toString(),
          gender: p.gender,
        })));
      }

      if (!myProfile) {
        throw new BadRequestException(
          'User profile not found in database. Please create and save your profile first by visiting the profile page.',
        );
      }

      if (!myProfile.gender) {
        throw new BadRequestException(
          'User profile missing gender. Please add your gender in the profile page and save it.',
        );
      }

      // Determine opposite gender: male → female, female → male
      const targetGender = myProfile.gender === 'male' ? 'female' : 'male';
      console.log('USING PROFILE GENDER:', myProfile.gender);
      console.log('TARGET GENDER (opposite):', targetGender);
      console.log('NOT USING USER ROLE FOR GENDER');

      // Build profile filter - ONLY use Profile model fields
      const normalizedTargetGender = normalizeGender(targetGender) ?? targetGender;
      const genderVariants = buildGenderVariants(normalizedTargetGender as 'male' | 'female');

      // Use case-insensitive regex with optional whitespace to match corrupted values
      // e.g., "Male ", " ذكر". This prevents missing results when genders are stored
      // with extra spaces or inconsistent casing in the database.
      const genderRegexVariants = genderVariants.map(
        v => new RegExp(`^\\s*${escapeRegex(v)}\\s*$`, 'i'),
      );

      const profileFilter: any = {
        gender: { $in: genderRegexVariants },
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
        profileFilter.dateOfBirth = { ...dobRange, $exists: true, $ne: null };
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

      // Optional exact-match filters
      const addIfPresent = (key: keyof SearchMembersDto, field: string) => {
        const val = filters[key];
        if (val && val !== 'all' && val !== '') {
          profileFilter[field] = buildExactMatchRegex(val as string);
        }
      };

      addIfPresent('city', 'city');
      addIfPresent('nationality', 'nationality');
      addIfPresent('education', 'education');
      addIfPresent('occupation', 'occupation');
      addIfPresent('religiosityLevel', 'religiosityLevel');

      // Handle marital status with STRICT gender-specific matching
      // Accept only statuses valid for the target gender, but include the opposite-gender
      // variant in the filter to catch incorrectly stored data (e.g. female profiles saved
      // with the male wording).
      if (filters.maritalStatus && filters.maritalStatus !== 'all' && filters.maritalStatus !== '') {
        const validStatuses = getMaritalStatusesForGender(targetGender);
        const normalizedStatus = normalizeMaritalStatusForGender(
          filters.maritalStatus,
          targetGender,
        );

        if (normalizedStatus && validStatuses.includes(normalizedStatus as any)) {
          const statusVariants = getMaritalStatusVariants(filters.maritalStatus);
          if (!statusVariants.includes(normalizedStatus)) {
            statusVariants.push(normalizedStatus);
          }

          const uniqueVariants = Array.from(new Set(statusVariants));

          // FIX: Convert all variants to case-insensitive Regex
          // This ensures 'Single' matches 'single', 'SINGLE', etc.
          const statusRegexVariants = uniqueVariants.map(
            v => new RegExp(`^${escapeRegex(v)}$`, 'i'),
          );

          profileFilter.maritalStatus = { $in: statusRegexVariants };

          console.log(
            `MARITAL STATUS REGEX MATCH: "${filters.maritalStatus}" -> Variants: ${uniqueVariants.join(', ')}`,
          );
        } else {
          // If status doesn't match target gender, ignore it (don't search by marital status)
          console.warn(
            `MARITAL STATUS IGNORED: "${filters.maritalStatus}" is not valid for target gender ${targetGender}`,
          );
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

      // Pagination
      const page = filters.page ?? 1;
      const perPage = filters.per_page ?? 20;
      const skip = (page - 1) * perPage;

      // Execute query with pagination
      // Note: Gender filter is already in profileFilter, so only correct gender profiles are returned
      const profiles = await this.profileModel
        .find(profileFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean()
        .exec();

      console.log(`FOUND ${profiles.length} PROFILES (page ${page}, ${perPage} per page)`);

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

      // Build results with age calculation and GENDER VALIDATION
      // CRITICAL: Filter out any profiles that don't match target gender
      // This is a safety check in case database has incorrect data
      const now = new Date();
      const results: SearchResult[] = [];

      for (const p of profiles) {
        const normalizedProfileGender = normalizeGender(p.gender as string);

        // STRICT GENDER CHECK: Skip if profile gender doesn't match target (after normalization)
        if (!normalizedProfileGender || normalizedProfileGender !== normalizedTargetGender) {
          console.warn(
            `SKIPPING PROFILE: Gender mismatch - profile has "${p.gender}" but target is "${targetGender}" (profile ID: ${p._id})`,
          );
          continue;
        }

        const userId = p.user?.toString();
        const userDoc = userId ? userMap.get(userId) : null;

        if (!userDoc) {
          continue; // Skip if user not found or not active
        }

        // Normalize marital status for display (fix any incorrect stored data)
        const normalizedMaritalStatus = p.maritalStatus
          ? normalizeMaritalStatusForGender(p.maritalStatus, p.gender as 'male' | 'female')
          : p.maritalStatus;

        // Validate marital status matches gender (additional safety check)
        if (
          normalizedMaritalStatus &&
          !isMaritalStatusValidForGender(
            normalizedMaritalStatus,
            p.gender as 'male' | 'female',
          )
        ) {
          console.warn(
            `SKIPPING PROFILE: Invalid marital status "${p.maritalStatus}" for gender "${p.gender}" (profile ID: ${p._id})`,
          );
          continue;
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
            // Use normalized marital status (corrected for gender)
            maritalStatus: normalizedMaritalStatus,
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

      console.log(`RETURNING ${results.length} SEARCH RESULTS (after gender/maritalStatus validation)`);

      // ===> FIX 2: ACCURATE COUNTING <===
      // Instead of counting only profiles, we need to count profiles belonging to ACTIVE users.
      // Using aggregation to filter by user status effectively.

      const countPipeline = [
        { $match: profileFilter },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'userDoc',
          },
        },
        { $unwind: '$userDoc' },
        {
          $match: {
            'userDoc.status': UserStatus.ACTIVE, // Only count active users
          },
        },
        {
          $count: 'total',
        },
      ];

      const countResult = await this.profileModel.aggregate(countPipeline).exec();
      const total = countResult.length > 0 ? countResult[0].total : 0;

      console.log(`TOTAL MATCHING ACTIVE PROFILES: ${total}`);

      const lastPage = Math.ceil(total / perPage);

      return {
        status: 'success',
        filters_received: filters,
        data: results,
        meta: {
          current_page: page,
          last_page: lastPage,
          per_page: perPage,
          // Total count of all matching profiles (across all pages)
          // Gender filter in profileFilter ensures this is accurate
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
