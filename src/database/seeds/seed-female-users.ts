import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../../modules/users/entities/user.entity';
import { Profile } from '../../modules/profiles/entities/profile.entity';
import dataSource from '../../config/data-source';

const femaleNames = [
  { firstName: 'فاطمة', lastName: 'أحمد' },
  { firstName: 'خديجة', lastName: 'محمد' },
  { firstName: 'عائشة', lastName: 'علي' },
  { firstName: 'مريم', lastName: 'حسن' },
  { firstName: 'زينب', lastName: 'إبراهيم' },
  { firstName: 'سارة', lastName: 'خالد' },
  { firstName: 'ليلى', lastName: 'عمر' },
  { firstName: 'نور', lastName: 'يوسف' },
  { firstName: 'هدى', lastName: 'عبدالله' },
  { firstName: 'آمنة', lastName: 'سعيد' },
  { firstName: 'رحمة', lastName: 'محمود' },
  { firstName: 'سلوى', lastName: 'أحمد' },
  { firstName: 'ريم', lastName: 'حسن' },
  { firstName: 'دنيا', lastName: 'علي' },
  { firstName: 'لينا', lastName: 'محمد' },
  { firstName: 'ياسمين', lastName: 'خالد' },
  { firstName: 'روضة', lastName: 'عمر' },
  { firstName: 'سلمى', lastName: 'يوسف' },
  { firstName: 'نادية', lastName: 'إبراهيم' },
  { firstName: 'وفاء', lastName: 'عبدالله' },
];

const cities = [
  'الرياض',
  'جدة',
  'المدينة المنورة',
  'الدمام',
  'مكة المكرمة',
  'الطائف',
  'تبوك',
  'بريدة',
  'خميس مشيط',
  'حائل',
];

const nationalities = ['السعودية', 'مصرية', 'سورية', 'أردنية', 'لبنانية'];

const educations = [
  'بكالوريوس',
  'ماجستير',
  'دكتوراه',
  'ثانوية عامة',
  'دبلوم',
];

const occupations = [
  'معلمة',
  'طبيبة',
  'مهندسة',
  'ممرضة',
  'محاسبة',
  'محامية',
  'صيدلانية',
  'موظفة',
];

const religiosityLevels = ['منخفض', 'متوسط', 'ملتزم', 'ملتزم جدا'];

const religions = ['الإسلام', 'المسيحية'];

const maritalStatuses = [
  'أعزب',
  'عزباء',
  'مطلق - بدون أولاد',
  'مطلق - مع أولاد',
];

const marriageTypes = ['زواج تقليدي', 'زواج بشروط خاصة'];

const polygamyOptions = ['اقبل بالتعدد', 'لا اقبل بالتعدد', 'حسب الظروف'];

const compatibilityOptions = ['نعم', 'لا'];

function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateDateOfBirth(age: number): Date {
  const today = new Date();
  const year = today.getFullYear() - age;
  const month = randomInt(1, 12);
  const day = randomInt(1, 28);
  return new Date(year, month - 1, day);
}

async function seedFemaleUsers() {
  console.log('>>> SEEDING: Starting to seed 20 female users...');
  console.log('>>> SEEDING: Initializing database connection...');

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  const userRepository = dataSource.getRepository(User);
  const profileRepository = dataSource.getRepository(Profile);

  try {
    // Check if data already exists
    const existingCount = await userRepository.count();
    if (existingCount > 0) {
      console.log(`>>> SEEDING: Found ${existingCount} existing users. Skipping seed.`);
      console.log('>>> SEEDING: To re-seed, clear the database first or modify the seed script.');
      return;
    }

    for (let i = 0; i < femaleNames.length; i++) {
      const name = femaleNames[i];
      const age = randomInt(22, 35);
      const dateOfBirth = generateDateOfBirth(age);
      const memberId = `MAW-${String(i + 1).padStart(6, '0')}`;
      const email = `female${i + 1}@mawaddah.com`;
      const password = await bcrypt.hash('password123', 10);

      // Create user
      const user = userRepository.create({
        email,
        password,
        memberId,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        membershipPlanId: 'basic',
        hasPurchasedExam: false,
      });

      const savedUser = await userRepository.save(user);
      console.log(`>>> SEEDING: Created user ${i + 1}/20 - ${memberId} (ID: ${savedUser.id})`);

      // Create profile
      const profile = profileRepository.create({
        userId: savedUser.id,
        firstName: name.firstName,
        lastName: name.lastName,
        gender: 'female',
        dateOfBirth,
        nationality: randomElement(nationalities),
        city: randomElement(cities),
        height: randomInt(155, 175),
        education: randomElement(educations),
        occupation: randomElement(occupations),
        religiosityLevel: randomElement(religiosityLevels),
        religion: randomElement(religions),
        maritalStatus: randomElement(maritalStatuses),
        marriageType: randomElement(marriageTypes),
        polygamyAcceptance: randomElement(polygamyOptions),
        compatibilityTest: randomElement(compatibilityOptions),
        countryOfResidence: randomElement(nationalities),
        about: `مرحبا، أنا ${name.firstName} ${name.lastName} من مدينة ${randomElement(cities)}. أبحث عن شريك الحياة المناسب.`,
        photoStorage: 'cloudinary',
        isVerified: Math.random() > 0.5, // Random verification status
      });

      await profileRepository.save(profile);
      console.log(`>>> SEEDING: Created profile for ${name.firstName} ${name.lastName}`);

      // Update user with profile_id
      savedUser.profileId = profile.id;
      await userRepository.save(savedUser);
    }

    console.log('>>> SEEDING: Successfully seeded 20 female users with profiles!');
    
    // Print summary
    const totalUsers = await userRepository.count();
    const totalProfiles = await profileRepository.count();
    const femaleProfiles = await profileRepository.count({ where: { gender: 'female' } });
    
    console.log('>>> SEEDING SUMMARY:');
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total Profiles: ${totalProfiles}`);
    console.log(`   Female Profiles: ${femaleProfiles}`);
  } catch (error) {
    console.error('>>> SEEDING ERROR:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

// Run if called directly
if (require.main === module) {
  seedFemaleUsers()
    .then(() => {
      console.log('>>> SEEDING: Completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('>>> SEEDING: Failed!', error);
      process.exit(1);
    });
}

export { seedFemaleUsers };

