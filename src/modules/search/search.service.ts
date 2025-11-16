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
    // ==================== DEBUG START ====================
    console.log('\n========== SEARCH START ==========');
    console.log('Raw filters received:', JSON.stringify(filters, null, 2));
    console.log('Exclude user ID:', excludeUserId);
    // ==================== DEBUG END ====================
    
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
      console.log(`\n========== Gender Normalization ==========`);
      console.log(`Input gender: "${filters.gender}" → Normalized: "${normalizedGender}"`);

      // ==================== DEBUG START: Check database state ====================
      const totalProfiles = await this.profileModel.countDocuments();
      const totalUsers = await this.userModel.countDocuments();
      const activeUsers = await this.userModel.countDocuments({ status: UserStatus.ACTIVE });
      console.log(`\nDatabase counts:`);
      console.log(`- Total profiles: ${totalProfiles}`);
      console.log(`- Total users: ${totalUsers}`);
      console.log(`- Active users: ${activeUsers}`);
      
      // Check actual gender values in database
      const actualGenders = await this.profileModel.distinct('gender');
      console.log(`\nActual gender values in database:`, actualGenders);
      // ==================== DEBUG END ====================

      // Build aggregation pipeline
      const pipeline: any[] = [];

      // Step 0: Only match profiles with clean data (gender in ["male", "female"] and valid dateOfBirth)
      // This ensures search only runs on valid profiles
      pipeline.push({
        $match: {
          gender: { $in: ['male', 'female'] },
          dateOfBirth: { $exists: true, $ne: null },
        },
      });

      // Step 1: Normalize gender values in the database using $addFields
      // This converts Arabic/corrupted values to "male" or "female" before filtering
      // Using nested $cond for better MongoDB compatibility
      // Note: With strict schema validation, this normalization should rarely be needed,
      // but we keep it for backward compatibility with existing data
      pipeline.push({
        $addFields: {
          trimmedGender: {
            $trim: {
              input: {
                $cond: {
                  if: { $ne: ['$gender', null] },
                  then: { $toLower: { $toString: '$gender' } },
                  else: ''
                }
              }
            }
          }
        }
      });

      pipeline.push({
        $addFields: {
          normalizedGender: {
            $cond: {
              // Check for Arabic "أنثى" (female)
              if: { $eq: ['$trimmedGender', 'أنثى'] },
              then: 'female',
              else: {
                $cond: {
                  // Check for Arabic "أنثي" (female variant)
                  if: { $eq: ['$trimmedGender', 'أنثي'] },
                  then: 'female',
                  else: {
                    $cond: {
                      // Check for Arabic "ذكر" (male)
                      if: { $eq: ['$trimmedGender', 'ذكر'] },
                      then: 'male',
                      else: {
                        $cond: {
                          // Check for Arabic "ذكور" (male plural)
                          if: { $eq: ['$trimmedGender', 'ذكور'] },
                          then: 'male',
                          else: {
                            $cond: {
                              // Check if contains "mal" (corrupted male values)
                              if: { 
                                $gt: [
                                  { $indexOfCP: ['$trimmedGender', 'mal'] },
                                  -1
                                ]
                              },
                              then: 'male',
                              else: {
                                $cond: {
                                  // Check if contains "fem" (corrupted female values)
                                  if: { 
                                    $gt: [
                                      { $indexOfCP: ['$trimmedGender', 'fem'] },
                                      -1
                                    ]
                                  },
                                  then: 'female',
                                  else: {
                                    $cond: {
                                      // Direct match for "male"
                                      if: { $eq: ['$trimmedGender', 'male'] },
                                      then: 'male',
                                      else: {
                                        $cond: {
                                          // Direct match for "female"
                                          if: { $eq: ['$trimmedGender', 'female'] },
                                          then: 'female',
                                          else: {
                                            $cond: {
                                              // Single character "m"
                                              if: { $eq: ['$trimmedGender', 'm'] },
                                              then: 'male',
                                              else: {
                                                $cond: {
                                                  // Single character "f"
                                                  if: { $eq: ['$trimmedGender', 'f'] },
                                                  then: 'female',
                                                  else: null
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Step 2: Calculate age from dateOfBirth using $addFields
      // If dateOfBirth is missing, age will be null (these profiles are excluded from age filtering)
      pipeline.push({
        $addFields: {
          age: {
            $cond: {
              if: { 
                $and: [
                  { $ne: ['$dateOfBirth', null] },
                  { $ne: ['$dateOfBirth', undefined] }
                ]
              },
              then: {
                $dateDiff: {
                  startDate: {
                    $cond: {
                      if: { $eq: [{ $type: '$dateOfBirth' }, 'string'] },
                      then: { 
                        $dateFromString: { 
                          dateString: '$dateOfBirth',
                          onError: null,
                          onNull: null
                        } 
                      },
                      else: '$dateOfBirth'
                    }
                  },
                  endDate: '$$NOW',
                  unit: 'year'
                }
              },
              else: null
            }
          }
        }
      });

      // Step 3: Build match conditions - Gender and Age are MANDATORY
      const profileMatch: Record<string, unknown> = {};

      // Gender filter - MANDATORY - case-insensitive match on normalizedGender
      profileMatch.normalizedGender = { $regex: `^${normalizedGender.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
      console.log(`\n========== Applying gender filter (MANDATORY) ==========`);
      console.log(`Searching for normalizedGender: "${normalizedGender}"`);

      // Age filter - MANDATORY - exclude profiles without dateOfBirth (age is null)
      const ageMatch: Record<string, unknown> = {};
      if (filters.minAge !== undefined) {
        ageMatch.$gte = filters.minAge;
      }
      if (filters.maxAge !== undefined) {
        ageMatch.$lte = filters.maxAge;
      }
      // CRITICAL: Only match profiles that have age calculated (dateOfBirth exists)
      ageMatch.$ne = null;
      profileMatch.age = ageMatch;
      
      console.log(`\n========== Applying age filter (MANDATORY) ==========`);
      console.log(`Age range: ${JSON.stringify(ageMatch)}`);
      console.log(`Note: Profiles without dateOfBirth will be excluded (age is null)`);

      // Optional filters - only add if provided
      if (filters.city && filters.city.trim().length > 0 && filters.city.trim().toLowerCase() !== 'all') {
        profileMatch.city = filters.city.trim();
        console.log(`\n[OPTIONAL] Adding city filter: "${filters.city.trim()}"`);
      }

      if (filters.nationality && filters.nationality.trim().length > 0 && filters.nationality.trim().toLowerCase() !== 'all') {
        profileMatch.nationality = filters.nationality.trim();
        console.log(`[OPTIONAL] Adding nationality filter: "${filters.nationality.trim()}"`);
      }

      if (filters.education && filters.education.trim().length > 0 && filters.education.trim().toLowerCase() !== 'all') {
        profileMatch.education = filters.education.trim();
        console.log(`[OPTIONAL] Adding education filter: "${filters.education.trim()}"`);
      }

      if (filters.occupation && filters.occupation.trim().length > 0 && filters.occupation.trim().toLowerCase() !== 'all') {
        profileMatch.occupation = filters.occupation.trim();
        console.log(`[OPTIONAL] Adding occupation filter: "${filters.occupation.trim()}"`);
      }

      if (filters.maritalStatus && filters.maritalStatus.trim().length > 0 && filters.maritalStatus.trim().toLowerCase() !== 'all') {
        profileMatch.maritalStatus = filters.maritalStatus.trim();
        console.log(`[OPTIONAL] Adding maritalStatus filter: "${filters.maritalStatus.trim()}"`);
      }

      if (filters.countryOfResidence && filters.countryOfResidence.trim().length > 0 && filters.countryOfResidence.trim().toLowerCase() !== 'all') {
        profileMatch.countryOfResidence = filters.countryOfResidence.trim();
        console.log(`[OPTIONAL] Adding countryOfResidence filter: "${filters.countryOfResidence.trim()}"`);
      }

      if (filters.religion && filters.religion.trim().length > 0 && filters.religion.trim().toLowerCase() !== 'all') {
        profileMatch.religion = filters.religion.trim();
        console.log(`[OPTIONAL] Adding religion filter: "${filters.religion.trim()}"`);
      }

      if (filters.religiosityLevel && filters.religiosityLevel.trim().length > 0 && filters.religiosityLevel.trim().toLowerCase() !== 'all') {
        profileMatch.religiosityLevel = filters.religiosityLevel.trim();
        console.log(`[OPTIONAL] Adding religiosityLevel filter: "${filters.religiosityLevel.trim()}"`);
      }

      if (filters.marriageType && filters.marriageType.trim().length > 0 && filters.marriageType.trim().toLowerCase() !== 'all') {
        profileMatch.marriageType = filters.marriageType.trim();
        console.log(`[OPTIONAL] Adding marriageType filter: "${filters.marriageType.trim()}"`);
      }

      if (filters.polygamyAcceptance && filters.polygamyAcceptance.trim().length > 0 && filters.polygamyAcceptance.trim().toLowerCase() !== 'all') {
        profileMatch.polygamyAcceptance = filters.polygamyAcceptance.trim();
        console.log(`[OPTIONAL] Adding polygamyAcceptance filter: "${filters.polygamyAcceptance.trim()}"`);
      }

      if (filters.compatibilityTest && filters.compatibilityTest.trim().length > 0 && filters.compatibilityTest.trim().toLowerCase() !== 'all') {
        profileMatch.compatibilityTest = filters.compatibilityTest.trim();
        console.log(`[OPTIONAL] Adding compatibilityTest filter: "${filters.compatibilityTest.trim()}"`);
      }

      if (filters.height !== undefined && filters.height > 0) {
        profileMatch.height = filters.height;
        console.log(`[OPTIONAL] Adding height filter: ${filters.height}`);
      }

      if (filters.hasPhoto === 'true') {
        profileMatch.photoUrl = { $exists: true, $nin: [null, ''] };
        console.log(`[OPTIONAL] Adding hasPhoto filter: true`);
      }

      if (filters.keyword && filters.keyword.trim().length > 0) {
        const keyword = filters.keyword.trim();
        profileMatch.$or = [
          { firstName: { $regex: keyword, $options: 'i' } },
          { lastName: { $regex: keyword, $options: 'i' } },
          { about: { $regex: keyword, $options: 'i' } },
          { city: { $regex: keyword, $options: 'i' } },
          { nationality: { $regex: keyword, $options: 'i' } }
        ];
        console.log(`[OPTIONAL] Adding keyword filter: "${keyword}"`);
      }

      // Apply profile match (gender + age + optional filters)
      pipeline.push({ $match: profileMatch });
      console.log('\n========== Profile match query (after normalization): ==========');
      console.log(JSON.stringify(profileMatch, null, 2));

      // ==================== DEBUG START: Test after gender match ====================
      const genderTestPipeline = [
        ...pipeline,
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { 
          $match: { 
            'user.status': UserStatus.ACTIVE
          } 
        },
        { $limit: 5 },
        {
          $project: {
            _id: 1,
            firstName: 1,
            gender: 1,
            normalizedGender: 1,
            age: 1,
            'user.status': 1
          }
        }
      ];
      
      const genderTestResults = await this.profileModel.aggregate(genderTestPipeline);
      console.log(`\n========== Results count after gender + age match: ${genderTestResults.length} ==========`);
      if (genderTestResults.length > 0) {
        console.log('Sample result:', JSON.stringify(genderTestResults[0], null, 2));
      } else {
        console.log('⚠️ No results after gender + age filter');
      }
      // ==================== DEBUG END ====================

      // Step 4: Lookup users
      pipeline.push({
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      });

      // Step 5: Unwind user array
      pipeline.push({ $unwind: '$user' });

      // Step 6: Filter active users only
      pipeline.push({
        $match: {
          'user.status': UserStatus.ACTIVE
        }
      });

      // ==================== DEBUG START: Test after status filter ====================
      const afterStatusPipeline = [...pipeline, { $limit: 3 }];
      const afterStatusResults = await this.profileModel.aggregate(afterStatusPipeline);
      console.log(`\n========== Results count after status filter: ${afterStatusResults.length} ==========`);
      if (afterStatusResults.length > 0) {
        console.log('Sample after status filter:', JSON.stringify(afterStatusResults[0], null, 2));
      }
      // ==================== DEBUG END ====================

      // Step 7: Filter by memberId if provided (optional)
      if (filters.memberId && filters.memberId.trim().length > 0) {
        pipeline.push({
          $match: {
            'user.memberId': { $regex: filters.memberId.trim(), $options: 'i' }
          }
        });
        console.log(`[OPTIONAL] Adding memberId filter: "${filters.memberId.trim()}"`);
      }

      // Step 8: Exclude current user if provided
      if (excludeUserId && Types.ObjectId.isValid(excludeUserId)) {
        pipeline.push({
          $match: {
            'user._id': { $ne: new Types.ObjectId(excludeUserId) }
          }
        });
        console.log(`[OPTIONAL] Excluding user ID: ${excludeUserId}`);
      }

      // Step 9: Project final fields (use original gender, not normalizedGender)
      pipeline.push({
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          gender: 1,
          age: 1,
          nationality: 1,
          city: 1,
          countryOfResidence: 1,
          education: 1,
          occupation: 1,
          maritalStatus: 1,
          marriageType: 1,
          polygamyAcceptance: 1,
          compatibilityTest: 1,
          religion: 1,
          religiosityLevel: 1,
          about: 1,
          photoUrl: 1,
          dateOfBirth: 1,
          height: 1,
          'user._id': 1,
          'user.email': 1,
          'user.role': 1,
          'user.status': 1,
          'user.memberId': 1
        }
      });

      // Step 10: Limit results
      const limit = filters.limit || 30;
      pipeline.push({ $limit: limit });

      // ==================== DEBUG START: Final pipeline ====================
      console.log('\n========== Final aggregation pipeline: ==========');
      console.log(JSON.stringify(pipeline, null, 2));
      // ==================== DEBUG END ====================

      // Execute aggregation
      const results = await this.profileModel.aggregate(pipeline);

      // ==================== DEBUG START: Final results ====================
      console.log(`\n========== Final results: ${results.length} ==========`);
      if (results.length > 0) {
        console.log('First result:', JSON.stringify(results[0], null, 2));
        if (results.length > 1) {
          console.log('Second result:', JSON.stringify(results[1], null, 2));
        }
      } else {
        console.log('⚠️ NO RESULTS FOUND - Review debug logs above to identify the stage that removed all results');
      }
      console.log('========== SEARCH END ==========\n');
      // ==================== DEBUG END ====================

      // Map results to expected format
      return results.map((result: any) => ({
        user: {
          id: result.user?._id?.toString() || '',
          email: result.user?.email || '',
          role: result.user?.role || '',
          status: result.user?.status || UserStatus.ACTIVE,
          memberId: result.user?.memberId || '',
        },
        profile: {
          id: result._id?.toString() || '',
          firstName: result.firstName,
          lastName: result.lastName,
          gender: result.gender,
          age: result.age,
          nationality: result.nationality,
          city: result.city,
          countryOfResidence: result.countryOfResidence,
          education: result.education,
          occupation: result.occupation,
          maritalStatus: result.maritalStatus,
          marriageType: result.marriageType,
          polygamyAcceptance: result.polygamyAcceptance,
          compatibilityTest: result.compatibilityTest,
          religion: result.religion,
          religiosityLevel: result.religiosityLevel,
          about: result.about,
          photoUrl: result.photoUrl,
          dateOfBirth: result.dateOfBirth,
          height: result.height,
        },
      }));

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
