import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from '../profiles/entities/profile.entity';
import { User, UserStatus } from '../users/entities/user.entity';
import { SearchMembersDto } from './dto/search-members.dto';

type SearchResult = {
  user: {
    id: number;
    email: string;
    role: string;
    status: UserStatus;
    memberId: string;
  };
  profile: {
    id: number;
    firstName?: string;
    lastName?: string;
    gender: string;
    age?: number;
    nationality: string;
    city: string;
    height?: number;
    education: string;
    occupation: string;
    religiosityLevel: string;
    religion?: string;
    maritalStatus: string;
    marriageType?: string;
    polygamyAcceptance?: string;
    compatibilityTest?: string;
    countryOfResidence?: string;
    about?: string;
    photoUrl?: string;
    dateOfBirth: Date;
    isVerified: boolean;
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
    @InjectRepository(Profile)
    private readonly profileRepo: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async searchMembers(
    dto: SearchMembersDto,
    excludeUserId?: string | number,
  ): Promise<SearchResponse> {
    console.log('SEARCH FILTER INPUT:', JSON.stringify(dto, null, 2));

    const page = dto.page ?? 1;
    const perPage = dto.per_page ?? 20;

    // CRITICAL: Get logged-in user's profile to determine target gender
    // We MUST use profiles.gender, NEVER users.role
    let targetGender: string | undefined = undefined;

    if (excludeUserId) {
      const userIdNum = typeof excludeUserId === 'string' ? parseInt(excludeUserId, 10) : excludeUserId;
      if (!isNaN(userIdNum)) {
        const myProfile = await this.profileRepo.findOne({
          where: { userId: userIdNum },
        });

        if (myProfile && myProfile.gender) {
          // Determine opposite gender: male → female, female → male
          targetGender = myProfile.gender === 'male' ? 'female' : 'male';
          console.log('USING PROFILE GENDER:', myProfile.gender);
          console.log('TARGET GENDER (opposite):', targetGender);
          console.log('NOT USING USER ROLE FOR GENDER');
        } else {
          console.log('WARNING: User profile missing gender. Search may return no results.');
        }
      }
    }

    // Allow explicit gender filter to override automatic detection
    if (dto.gender && dto.gender !== 'all' && dto.gender !== '') {
      targetGender = dto.gender;
      console.log('GENDER FILTER OVERRIDE:', targetGender);
    }

    const qb = this.profileRepo
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('user.status = :status', { status: UserStatus.ACTIVE });

    // CRITICAL: Filter by profiles.gender, NEVER users.role
    if (targetGender) {
      qb.andWhere('profile.gender = :targetGender', { targetGender });
      console.log('FILTERING BY PROFILE.GENDER:', targetGender);
      console.log('NOT FILTERING BY USER.ROLE');
    }

    if (excludeUserId) {
      const userIdNum = typeof excludeUserId === 'string' ? parseInt(excludeUserId, 10) : excludeUserId;
      if (!isNaN(userIdNum)) {
        qb.andWhere('profile.userId != :excludeUserId', { excludeUserId: userIdNum });
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dto.maxAge !== undefined) {
      const maxAgeDate = new Date(today);
      maxAgeDate.setFullYear(maxAgeDate.getFullYear() - dto.maxAge);
      qb.andWhere('profile.dateOfBirth >= :maxAgeDate', { maxAgeDate });
    }

    if (dto.minAge !== undefined) {
      const minAgeDate = new Date(today);
      minAgeDate.setFullYear(minAgeDate.getFullYear() - dto.minAge);
      minAgeDate.setHours(23, 59, 59, 999);
      qb.andWhere('profile.dateOfBirth <= :minAgeDate', { minAgeDate });
    }

    if (dto.minHeight !== undefined) {
      qb.andWhere('profile.height >= :minHeight', { minHeight: dto.minHeight });
    }

    if (dto.maxHeight !== undefined) {
      qb.andWhere('profile.height <= :maxHeight', { maxHeight: dto.maxHeight });
    }

    if (dto.city && dto.city !== 'all' && dto.city !== '') {
      qb.andWhere('profile.city = :city', { city: dto.city });
    }

    if (dto.nationality && dto.nationality !== 'all' && dto.nationality !== '') {
      qb.andWhere('profile.nationality = :nationality', { nationality: dto.nationality });
    }

    if (dto.countryOfResidence && dto.countryOfResidence !== 'all' && dto.countryOfResidence !== '') {
      qb.andWhere('profile.countryOfResidence = :countryOfResidence', { countryOfResidence: dto.countryOfResidence });
    }

    if (dto.education && dto.education !== 'all' && dto.education !== '') {
      qb.andWhere('profile.education = :education', { education: dto.education });
    }

    if (dto.occupation && dto.occupation !== 'all' && dto.occupation !== '') {
      qb.andWhere('profile.occupation = :occupation', { occupation: dto.occupation });
    }

    if (dto.religion && dto.religion !== 'all' && dto.religion !== '') {
      qb.andWhere('profile.religion = :religion', { religion: dto.religion });
    }

    if (dto.religiosityLevel && dto.religiosityLevel !== 'all' && dto.religiosityLevel !== '') {
      qb.andWhere('profile.religiosityLevel = :religiosityLevel', { religiosityLevel: dto.religiosityLevel });
    }

    if (dto.maritalStatus && dto.maritalStatus !== 'all' && dto.maritalStatus !== '') {
      qb.andWhere('profile.maritalStatus = :maritalStatus', { maritalStatus: dto.maritalStatus });
    }

    if (dto.marriageType && dto.marriageType !== 'all' && dto.marriageType !== '') {
      qb.andWhere('profile.marriageType = :marriageType', { marriageType: dto.marriageType });
    }

    if (dto.polygamyAcceptance && dto.polygamyAcceptance !== 'all' && dto.polygamyAcceptance !== '') {
      qb.andWhere('profile.polygamyAcceptance = :polygamyAcceptance', { polygamyAcceptance: dto.polygamyAcceptance });
    }

    if (dto.compatibilityTest && dto.compatibilityTest !== 'all' && dto.compatibilityTest !== '') {
      qb.andWhere('profile.compatibilityTest = :compatibilityTest', { compatibilityTest: dto.compatibilityTest });
    }

    if (dto.hasPhoto === 'true') {
      qb.andWhere('profile.photoUrl IS NOT NULL AND profile.photoUrl != ""');
    }

    if (dto.keyword && dto.keyword.trim() !== '') {
      const keyword = `%${dto.keyword.trim()}%`;
      qb.andWhere(
        '(profile.firstName LIKE :keyword OR profile.lastName LIKE :keyword OR profile.about LIKE :keyword OR profile.city LIKE :keyword OR profile.nationality LIKE :keyword)',
        { keyword },
      );
    }

    if (dto.memberId && dto.memberId.trim() !== '') {
      qb.andWhere('user.memberId = :memberId', { memberId: dto.memberId.trim() });
    }

    qb.orderBy('profile.createdAt', 'DESC');

    const skip = (page - 1) * perPage;
    qb.skip(skip).take(perPage);

    console.log('FINAL SQL:', qb.getQuery());
    console.log('SQL PARAMETERS:', qb.getParameters());

    const [profiles, total] = await qb.getManyAndCount();

    const now = new Date();
    const results: SearchResult[] = [];

    for (const profile of profiles) {
      if (!profile.user || profile.user.status !== UserStatus.ACTIVE) {
        continue;
      }

      const dob = profile.dateOfBirth ? new Date(profile.dateOfBirth) : null;
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
          id: profile.user.id,
          email: profile.user.email,
          role: profile.user.role,
          status: profile.user.status,
          memberId: profile.user.memberId,
        },
        profile: {
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          gender: profile.gender,
          age,
          nationality: profile.nationality,
          city: profile.city,
          height: profile.height,
          education: profile.education,
          occupation: profile.occupation,
          religiosityLevel: profile.religiosityLevel,
          religion: profile.religion,
          maritalStatus: profile.maritalStatus,
          marriageType: profile.marriageType,
          polygamyAcceptance: profile.polygamyAcceptance,
          compatibilityTest: profile.compatibilityTest,
          countryOfResidence: profile.countryOfResidence,
          about: profile.about,
          photoUrl: profile.photoUrl,
          dateOfBirth: profile.dateOfBirth,
          isVerified: profile.isVerified,
        },
      });
    }

    const lastPage = Math.ceil(total / perPage);

    return {
      status: 'success',
      filters_received: dto,
      data: results,
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total,
      },
    };
  }
}
