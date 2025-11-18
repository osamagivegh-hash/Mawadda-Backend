/**
 * Database Seed Script - Profile Data
 * 
 * This script seeds the database with diverse user and profile data for testing search and filter functionality.
 * 
 * Run this script:
 *   npm run seed:profiles
 * 
 * Or directly:
 *   npx ts-node src/database/seeds/seed-profiles.ts
 * 
 * WARNING: This script will create new users and profiles. Existing users with the same emails will be skipped.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from '../../modules/profiles/schemas/profile.schema';
import { User, UserDocument, UserRole, UserStatus } from '../../modules/users/schemas/user.schema';
import { getModelToken } from '@nestjs/mongoose';
import { INestApplicationContext } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';

interface SeedProfileData {
  email: string;
  password: string;
  memberId: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    gender: 'male' | 'female';
    dateOfBirth: Date;
    nationality: string;
    city: string;
    countryOfResidence?: string;
    height?: number;
    education: string;
    occupation: string;
    religiosityLevel: string;
    religion?: string;
    maritalStatus: string;
    marriageType?: string;
    polygamyAcceptance?: string;
    compatibilityTest?: string;
    about?: string;
    photoUrl?: string;
  };
}

// Diverse seed data for testing search and filters
const seedData: SeedProfileData[] = [
  // Female profiles - Age range 22-35
  {
    email: 'sara.ahmed@test.com',
    password: 'password123',
    memberId: 'MEM001',
    role: UserRole.USER,
    profile: {
      firstName: 'سارة',
      lastName: 'أحمد',
      gender: 'female',
      dateOfBirth: new Date(1995, 5, 15), // Age ~29
      nationality: 'السعودية',
      city: 'الرياض',
      countryOfResidence: 'السعودية',
      height: 165,
      education: 'بكالوريوس',
      occupation: 'مهندسة',
      religiosityLevel: 'ملتزم',
      religion: 'الإسلام',
      maritalStatus: 'عزباء',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'أبحث عن شريك حياة متدين ومحترم',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  {
    email: 'fatima.hassan@test.com',
    password: 'password123',
    memberId: 'MEM002',
    role: UserRole.USER,
    profile: {
      firstName: 'فاطمة',
      lastName: 'حسن',
      gender: 'female',
      dateOfBirth: new Date(1998, 2, 20), // Age ~26
      nationality: 'مصر',
      city: 'القاهرة',
      countryOfResidence: 'مصر',
      height: 160,
      education: 'ماجستير',
      occupation: 'طبيبة',
      religiosityLevel: 'ملتزم جدا',
      religion: 'الإسلام',
      maritalStatus: 'عزباء',
      marriageType: 'زواج بشروط خاصة',
      polygamyAcceptance: 'حسب الظروف',
      compatibilityTest: 'نعم',
      about: 'طبيبة متخصصة في أمراض القلب',
    },
  },
  {
    email: 'mariam.ali@test.com',
    password: 'password123',
    memberId: 'MEM003',
    role: UserRole.USER,
    profile: {
      firstName: 'مريم',
      lastName: 'علي',
      gender: 'female',
      dateOfBirth: new Date(2000, 8, 10), // Age ~24
      nationality: 'الإمارات',
      city: 'دبي',
      countryOfResidence: 'الإمارات',
      height: 170,
      education: 'بكالوريوس',
      occupation: 'معلمة',
      religiosityLevel: 'متوسط',
      religion: 'الإسلام',
      maritalStatus: 'عزباء',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'لا',
      about: 'معلمة لغة عربية',
    },
  },
  {
    email: 'noor.khalid@test.com',
    password: 'password123',
    memberId: 'MEM004',
    role: UserRole.USER,
    profile: {
      firstName: 'نور',
      lastName: 'خالد',
      gender: 'female',
      dateOfBirth: new Date(1993, 11, 5), // Age ~31
      nationality: 'الكويت',
      city: 'الكويت',
      countryOfResidence: 'الكويت',
      height: 158,
      education: 'دكتوراه',
      occupation: 'أستاذة جامعية',
      religiosityLevel: 'ملتزم جدا',
      religion: 'الإسلام',
      maritalStatus: 'مطلق - بدون أولاد',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'أستاذة في علم النفس',
    },
  },
  {
    email: 'layla.omar@test.com',
    password: 'password123',
    memberId: 'MEM005',
    role: UserRole.USER,
    profile: {
      firstName: 'ليلى',
      lastName: 'عمر',
      gender: 'female',
      dateOfBirth: new Date(1996, 0, 25), // Age ~28
      nationality: 'المغرب',
      city: 'الدار البيضاء',
      countryOfResidence: 'المغرب',
      height: 162,
      education: 'بكالوريوس',
      occupation: 'محاسبة',
      religiosityLevel: 'ملتزم',
      religion: 'الإسلام',
      maritalStatus: 'عزباء',
      marriageType: 'زواج بشروط خاصة',
      polygamyAcceptance: 'اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'محاسبة معتمدة',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  {
    email: 'amira.youssef@test.com',
    password: 'password123',
    memberId: 'MEM006',
    role: UserRole.USER,
    profile: {
      firstName: 'أميرة',
      lastName: 'يوسف',
      gender: 'female',
      dateOfBirth: new Date(1999, 6, 12), // Age ~25
      nationality: 'لبنان',
      city: 'بيروت',
      countryOfResidence: 'لبنان',
      height: 168,
      education: 'ماجستير',
      occupation: 'محامية',
      religiosityLevel: 'منخفض',
      religion: 'الإسلام',
      maritalStatus: 'عزباء',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'لا',
      about: 'محامية متخصصة في القانون التجاري',
    },
  },
  {
    email: 'hala.mahmoud@test.com',
    password: 'password123',
    memberId: 'MEM007',
    role: UserRole.USER,
    profile: {
      firstName: 'هالة',
      lastName: 'محمود',
      gender: 'female',
      dateOfBirth: new Date(1991, 3, 18), // Age ~33
      nationality: 'السودان',
      city: 'الخرطوم',
      countryOfResidence: 'السودان',
      height: 163,
      education: 'بكالوريوس',
      occupation: 'صيدلانية',
      religiosityLevel: 'ملتزم',
      religion: 'الإسلام',
      maritalStatus: 'أرمل - بدون أولاد',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'حسب الظروف',
      compatibilityTest: 'نعم',
      about: 'صيدلانية معتمدة',
    },
  },
  {
    email: 'rania.ibrahim@test.com',
    password: 'password123',
    memberId: 'MEM008',
    role: UserRole.USER,
    profile: {
      firstName: 'رانيا',
      lastName: 'إبراهيم',
      gender: 'female',
      dateOfBirth: new Date(1997, 9, 30), // Age ~27
      nationality: 'الأردن',
      city: 'عمان',
      countryOfResidence: 'الأردن',
      height: 165,
      education: 'بكالوريوس',
      occupation: 'مصممة جرافيك',
      religiosityLevel: 'متوسط',
      religion: 'الإسلام',
      maritalStatus: 'عزباء',
      marriageType: 'زواج بشروط خاصة',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'مصممة جرافيك محترفة',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  // Male profiles - Age range 25-40
  {
    email: 'ahmed.mohammed@test.com',
    password: 'password123',
    memberId: 'MEM009',
    role: UserRole.USER,
    profile: {
      firstName: 'أحمد',
      lastName: 'محمد',
      gender: 'male',
      dateOfBirth: new Date(1990, 4, 10), // Age ~34
      nationality: 'السعودية',
      city: 'جدة',
      countryOfResidence: 'السعودية',
      height: 180,
      education: 'ماجستير',
      occupation: 'مهندس',
      religiosityLevel: 'ملتزم',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'مهندس برمجيات متخصص',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  {
    email: 'omar.abdullah@test.com',
    password: 'password123',
    memberId: 'MEM010',
    role: UserRole.USER,
    profile: {
      firstName: 'عمر',
      lastName: 'عبدالله',
      gender: 'male',
      dateOfBirth: new Date(1992, 7, 22), // Age ~32
      nationality: 'الإمارات',
      city: 'أبوظبي',
      countryOfResidence: 'الإمارات',
      height: 175,
      education: 'بكالوريوس',
      occupation: 'طبيب',
      religiosityLevel: 'ملتزم جدا',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج بشروط خاصة',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'طبيب جراح متخصص',
    },
  },
  {
    email: 'khalid.saad@test.com',
    password: 'password123',
    memberId: 'MEM011',
    role: UserRole.USER,
    profile: {
      firstName: 'خالد',
      lastName: 'سعد',
      gender: 'male',
      dateOfBirth: new Date(1995, 1, 14), // Age ~29
      nationality: 'مصر',
      city: 'الإسكندرية',
      countryOfResidence: 'مصر',
      height: 178,
      education: 'دكتوراه',
      occupation: 'أستاذ جامعي',
      religiosityLevel: 'ملتزم',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'حسب الظروف',
      compatibilityTest: 'نعم',
      about: 'أستاذ في الهندسة المعمارية',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  {
    email: 'youssef.hamza@test.com',
    password: 'password123',
    memberId: 'MEM012',
    role: UserRole.USER,
    profile: {
      firstName: 'يوسف',
      lastName: 'حمزة',
      gender: 'male',
      dateOfBirth: new Date(1998, 10, 8), // Age ~26
      nationality: 'المغرب',
      city: 'الرباط',
      countryOfResidence: 'المغرب',
      height: 172,
      education: 'بكالوريوس',
      occupation: 'محاسب',
      religiosityLevel: 'متوسط',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'لا',
      about: 'محاسب معتمد',
    },
  },
  {
    email: 'tariq.nasser@test.com',
    password: 'password123',
    memberId: 'MEM013',
    role: UserRole.USER,
    profile: {
      firstName: 'طارق',
      lastName: 'ناصر',
      gender: 'male',
      dateOfBirth: new Date(1988, 5, 3), // Age ~36
      nationality: 'الكويت',
      city: 'الكويت',
      countryOfResidence: 'الكويت',
      height: 185,
      education: 'ماجستير',
      occupation: 'رجل أعمال',
      religiosityLevel: 'ملتزم جدا',
      religion: 'الإسلام',
      maritalStatus: 'مطلق - مع أولاد',
      marriageType: 'زواج بشروط خاصة',
      polygamyAcceptance: 'اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'رجل أعمال ناجح',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  {
    email: 'mohammed.ali@test.com',
    password: 'password123',
    memberId: 'MEM014',
    role: UserRole.USER,
    profile: {
      firstName: 'محمد',
      lastName: 'علي',
      gender: 'male',
      dateOfBirth: new Date(1994, 8, 20), // Age ~30
      nationality: 'لبنان',
      city: 'طرابلس',
      countryOfResidence: 'لبنان',
      height: 180,
      education: 'بكالوريوس',
      occupation: 'مهندس',
      religiosityLevel: 'ملتزم',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'مهندس مدني',
    },
  },
  {
    email: 'hassan.mahmoud@test.com',
    password: 'password123',
    memberId: 'MEM015',
    role: UserRole.USER,
    profile: {
      firstName: 'حسان',
      lastName: 'محمود',
      gender: 'male',
      dateOfBirth: new Date(1996, 2, 15), // Age ~28
      nationality: 'السودان',
      city: 'بورتسودان',
      countryOfResidence: 'السودان',
      height: 175,
      education: 'ماجستير',
      occupation: 'صيدلي',
      religiosityLevel: 'ملتزم',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج بشروط خاصة',
      polygamyAcceptance: 'حسب الظروف',
      compatibilityTest: 'نعم',
      about: 'صيدلي متخصص',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  {
    email: 'ibrahim.saleh@test.com',
    password: 'password123',
    memberId: 'MEM016',
    role: UserRole.USER,
    profile: {
      firstName: 'إبراهيم',
      lastName: 'صالح',
      gender: 'male',
      dateOfBirth: new Date(1991, 11, 25), // Age ~33
      nationality: 'الأردن',
      city: 'إربد',
      countryOfResidence: 'الأردن',
      height: 178,
      education: 'بكالوريوس',
      occupation: 'معلم',
      religiosityLevel: 'منخفض',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'لا',
      about: 'معلم رياضيات',
    },
  },
  {
    email: 'abdulrahman.fahad@test.com',
    password: 'password123',
    memberId: 'MEM017',
    role: UserRole.USER,
    profile: {
      firstName: 'عبدالرحمن',
      lastName: 'فهد',
      gender: 'male',
      dateOfBirth: new Date(1985, 0, 5), // Age ~40
      nationality: 'السعودية',
      city: 'الدمام',
      countryOfResidence: 'السعودية',
      height: 182,
      education: 'دكتوراه',
      occupation: 'أستاذ جامعي',
      religiosityLevel: 'ملتزم جدا',
      religion: 'الإسلام',
      maritalStatus: 'أرمل - بدون أولاد',
      marriageType: 'زواج تقليدي',
      polygamyAcceptance: 'اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'أستاذ في الفقه الإسلامي',
      photoUrl: 'https://via.placeholder.com/300',
    },
  },
  {
    email: 'fahad.khalid@test.com',
    password: 'password123',
    memberId: 'MEM018',
    role: UserRole.USER,
    profile: {
      firstName: 'فهد',
      lastName: 'خالد',
      gender: 'male',
      dateOfBirth: new Date(1999, 4, 12), // Age ~25
      nationality: 'قطر',
      city: 'الدوحة',
      countryOfResidence: 'قطر',
      height: 170,
      education: 'بكالوريوس',
      occupation: 'مطور برمجيات',
      religiosityLevel: 'متوسط',
      religion: 'الإسلام',
      maritalStatus: 'أعزب',
      marriageType: 'زواج بشروط خاصة',
      polygamyAcceptance: 'لا اقبل بالتعدد',
      compatibilityTest: 'نعم',
      about: 'مطور تطبيقات موبايل',
    },
  },
];

async function seedProfiles(app: INestApplicationContext) {
  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const profileModel = app.get<Model<ProfileDocument>>(getModelToken(Profile.name));

  console.log('\n========== SEEDING DATABASE ==========');
  console.log(`Seeding ${seedData.length} users and profiles...\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const data of seedData) {
    try {
      // Check if user already exists
      const existingUser = await userModel.findOne({ email: data.email }).exec();
      if (existingUser) {
        console.log(`⏭️  Skipping ${data.email} - user already exists`);
        skipped++;
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = new userModel({
        email: data.email,
        password: hashedPassword,
        memberId: data.memberId,
        role: data.role,
        status: UserStatus.ACTIVE,
      });

      const savedUser = await user.save();
      console.log(`✅ Created user: ${data.email} (${data.memberId})`);

      // Create profile
      const profile = new profileModel({
        user: savedUser._id,
        ...data.profile,
        isVerified: false,
      });

      await profile.save();
      console.log(`   ✅ Created profile for ${data.profile.firstName} ${data.profile.lastName}`);
      created++;

    } catch (error) {
      console.error(`❌ Error creating ${data.email}:`, error);
      errors++;
    }
  }

  console.log('\n========== SEEDING SUMMARY ==========');
  console.log(`Total records: ${seedData.length}`);
  console.log(`✅ Created: ${created}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log('======================================\n');

  // Show statistics
  const totalUsers = await userModel.countDocuments();
  const totalProfiles = await profileModel.countDocuments();
  const maleProfiles = await profileModel.countDocuments({ gender: 'male' });
  const femaleProfiles = await profileModel.countDocuments({ gender: 'female' });

  console.log('========== DATABASE STATISTICS ==========');
  console.log(`Total users: ${totalUsers}`);
  console.log(`Total profiles: ${totalProfiles}`);
  console.log(`Male profiles: ${maleProfiles}`);
  console.log(`Female profiles: ${femaleProfiles}`);
  console.log('=========================================\n');
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    await seedProfiles(app);
    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
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

export { seedProfiles, seedData };

