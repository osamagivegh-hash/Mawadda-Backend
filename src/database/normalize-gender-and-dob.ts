/**
 * Database Normalization Script
 * 
 * This script normalizes gender values and validates dateOfBirth fields in the profiles collection.
 * 
 * Run this script ONCE to clean up existing data:
 * 
 * Option 1: Run via NestJS CLI command
 *   npm run migration:normalize-gender-dob
 * 
 * Option 2: Run directly via ts-node
 *   npx ts-node src/database/normalize-gender-and-dob.ts
 * 
 * Option 3: Import and run from another script
 * 
 * WARNING: This script MODIFIES your database. Make a backup first!
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from '../modules/profiles/schemas/profile.schema';
import { getModelToken } from '@nestjs/mongoose';
import { INestApplicationContext } from '@nestjs/common';

/**
 * Normalize gender value to standard English format
 */
function normalizeGenderValue(gender: string | null | undefined): string | null {
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
  
  // Handle corrupted values - check if it starts with or contains "mal" or "fem"
  if (trimmed.includes('mal')) {
    return 'male';
  }
  if (trimmed.includes('fem')) {
    return 'female';
  }
  
  // Direct English values
  if (trimmed === 'male' || trimmed === 'm') {
    return 'male';
  }
  if (trimmed === 'female' || trimmed === 'f') {
    return 'female';
  }
  
  // If we can't normalize, return null (will be set to null in DB)
  console.warn(`⚠️  Could not normalize gender value: "${gender}"`);
  return null;
}

/**
 * Validate and normalize dateOfBirth
 * Ensures it's a valid Date object or ISO string
 */
function normalizeDateOfBirth(dateOfBirth: any): Date | null {
  if (!dateOfBirth) return null;
  
  // If already a Date object, check if valid
  if (dateOfBirth instanceof Date) {
    if (isNaN(dateOfBirth.getTime())) {
      console.warn(`⚠️  Invalid Date object: ${dateOfBirth}`);
      return null;
    }
    return dateOfBirth;
  }
  
  // If string, try to parse as ISO date
  if (typeof dateOfBirth === 'string') {
    const parsed = new Date(dateOfBirth);
    if (isNaN(parsed.getTime())) {
      console.warn(`⚠️  Invalid date string: "${dateOfBirth}"`);
      return null;
    }
    return parsed;
  }
  
  // Can't normalize
  console.warn(`⚠️  Unexpected dateOfBirth type: ${typeof dateOfBirth}`);
  return null;
}

async function normalizeDatabase(app: INestApplicationContext) {
  const profileModel = app.get<Model<ProfileDocument>>(getModelToken(Profile.name));
  
  console.log('\n========== DATABASE NORMALIZATION START ==========');
  console.log('This script will normalize gender values and validate dateOfBirth fields.');
  console.log('WARNING: This will modify your database. Make sure you have a backup!\n');
  
  try {
    // Get all profiles
    const profiles = await profileModel.find({}).lean();
    console.log(`Found ${profiles.length} profiles to process\n`);
    
    let genderUpdated = 0;
    let genderNullSet = 0;
    let dobUpdated = 0;
    let dobNullSet = 0;
    let unchanged = 0;
    
    for (const profile of profiles) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Normalize gender
      const currentGender = profile.gender;
      const normalizedGender = normalizeGenderValue(currentGender);
      
      if (normalizedGender !== currentGender) {
        if (normalizedGender === null) {
          updates.gender = null;
          genderNullSet++;
          needsUpdate = true;
          console.log(`Profile ${profile._id}: Setting gender to null (was: "${currentGender}")`);
        } else {
          updates.gender = normalizedGender;
          genderUpdated++;
          needsUpdate = true;
          console.log(`Profile ${profile._id}: "${currentGender}" → "${normalizedGender}"`);
        }
      }
      
      // Normalize dateOfBirth
      const currentDob = profile.dateOfBirth;
      const normalizedDob = normalizeDateOfBirth(currentDob);
      
      if (normalizedDob !== currentDob) {
        if (normalizedDob === null) {
          // Only set to null if it was invalid (don't overwrite valid nulls)
          if (currentDob !== null && currentDob !== undefined) {
            updates.dateOfBirth = null;
            dobNullSet++;
            needsUpdate = true;
            console.log(`Profile ${profile._id}: Setting dateOfBirth to null (was invalid: ${currentDob})`);
          }
        } else {
          // Convert to Date if it's a different instance
          if (!(currentDob instanceof Date) || currentDob.getTime() !== normalizedDob.getTime()) {
            updates.dateOfBirth = normalizedDob;
            dobUpdated++;
            needsUpdate = true;
            console.log(`Profile ${profile._id}: Normalized dateOfBirth to ${normalizedDob.toISOString()}`);
          }
        }
      }
      
      // Apply updates if needed
      if (needsUpdate) {
        await profileModel.updateOne(
          { _id: profile._id },
          { $set: updates }
        );
      } else {
        unchanged++;
      }
    }
    
    console.log('\n========== NORMALIZATION SUMMARY ==========');
    console.log(`Total profiles processed: ${profiles.length}`);
    console.log(`Gender values updated: ${genderUpdated}`);
    console.log(`Gender values set to null (invalid): ${genderNullSet}`);
    console.log(`dateOfBirth values updated: ${dobUpdated}`);
    console.log(`dateOfBirth values set to null (invalid): ${dobNullSet}`);
    console.log(`Profiles unchanged: ${unchanged}`);
    console.log('===========================================\n');
    
    // Show final statistics
    const finalGenders = await profileModel.distinct('gender');
    const profilesWithDob = await profileModel.countDocuments({ dateOfBirth: { $ne: null } });
    const profilesWithoutDob = await profileModel.countDocuments({ dateOfBirth: null });
    
    console.log('========== FINAL STATISTICS ==========');
    console.log(`Unique gender values: ${JSON.stringify(finalGenders)}`);
    console.log(`Profiles with dateOfBirth: ${profilesWithDob}`);
    console.log(`Profiles without dateOfBirth: ${profilesWithoutDob}`);
    console.log('======================================\n');
    
  } catch (error) {
    console.error('\n❌ ERROR during normalization:', error);
    throw error;
  }
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    await normalizeDatabase(app);
    console.log('✅ Normalization completed successfully!');
  } catch (error) {
    console.error('❌ Normalization failed:', error);
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

export { normalizeDatabase, normalizeGenderValue, normalizeDateOfBirth };

