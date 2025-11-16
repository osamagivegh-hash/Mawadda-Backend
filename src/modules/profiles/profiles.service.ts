import { Injectable, NotFoundException, Logger, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UploadsService, UploadResult } from '../../uploads/uploads.service';

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    private readonly uploadsService: UploadsService,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto): Promise<Profile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }

    // Check if profile already exists (defensive fix for duplicate requests)
    const existing = await this.profileModel.findOne({ user: userId }).lean().exec();
    if (existing) {
      // If profile exists, return it instead of throwing error (idempotent behavior)
      // This handles duplicate POST requests gracefully
      this.logger.warn(`Profile already exists for user ${userId}, returning existing profile`);
      return existing as Profile;
    }

    // Convert dateOfBirth string to Date
    const profileData = {
      ...createProfileDto,
      user: new Types.ObjectId(userId),
      dateOfBirth: new Date(createProfileDto.dateOfBirth),
    };

    // Use findOneAndUpdate with upsert to handle race conditions
    // This ensures that even if two requests arrive simultaneously, only one profile is created
    const created = await this.profileModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      profileData,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean().exec();

    if (!created) {
      throw new Error('Failed to create profile');
    }

    return created as Profile;
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    if (!Types.ObjectId.isValid(userId)) return null;
    return this.profileModel.findOne({ user: userId }).lean().exec();
  }

  async upsert(userId: string): Promise<ProfileDocument> {
    return this.profileModel
      .findOneAndUpdate(
        { user: userId },
        { user: userId },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async update(
    userId: string,
    updateProfileDto: UpdateProfileDto & Record<string, any>, // Accept all fields
  ): Promise<Profile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }

    // LOG: Debug what's being received
    this.logger.debug(`=== PROFILE UPDATE DEBUG ===`);
    this.logger.debug(`User ID: ${userId}`);
    this.logger.debug(`Received DTO keys: ${Object.keys(updateProfileDto)}`);
    this.logger.debug(`Received DTO:`, JSON.stringify(updateProfileDto, null, 2));

    // Build update object - include all provided fields, including empty strings
    // This allows users to clear fields by sending empty values
    const updateData: Record<string, any> = { user: userId };
    
    // CRITICAL: Process ALL fields from DTO - don't skip any
    // List of all valid profile fields to ensure we process everything
    const validProfileFields = [
      'firstName', 'lastName', 'gender', 'dateOfBirth', 'nationality',
      'city', 'countryOfResidence', 'education', 'occupation',
      'religiosityLevel', 'religion', 'maritalStatus', 'marriageType',
      'polygamyAcceptance', 'compatibilityTest', 'about',
      'guardianName', 'guardianContact'
    ];
    
    // Process all valid profile fields that are present in the DTO
    // CRITICAL: Only process fields that are actually in the DTO (were sent from frontend)
    validProfileFields.forEach((fieldName) => {
      // Check if field exists in DTO (even if value is empty string)
      if (fieldName in updateProfileDto) {
        const value = updateProfileDto[fieldName];
        // Include ALL fields that are present - even empty strings
        if (value === null || value === undefined) {
          // For null/undefined, set to empty string to clear the field
          updateData[fieldName] = '';
        } else if (typeof value === 'string') {
          // For strings, always include (even if empty after trim)
          const trimmed = value.trim();
          updateData[fieldName] = trimmed;
        } else {
          // For non-strings (numbers, booleans, etc.), include as-is
          updateData[fieldName] = value;
        }
      }
      // If field is NOT in DTO, don't add it to updateData (preserve existing value)
    });
    
    // Also process any other fields that might be in the DTO (for safety)
    Object.entries(updateProfileDto).forEach(([key, value]) => {
      // Skip if already processed or if it's an internal field
      if (validProfileFields.includes(key) || key === 'user' || key === 'id') {
        return;
      }
      // Include other valid fields
      if (value !== null && value !== undefined) {
        if (typeof value === 'string') {
          updateData[key] = value.trim();
        } else {
          updateData[key] = value;
        }
      }
    });

    // If dateOfBirth is provided as string, convert to Date
    if (updateData.dateOfBirth && typeof updateData.dateOfBirth === 'string') {
      updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }

    this.logger.debug(`=== FINAL UPDATE DATA ===`);
    this.logger.debug(`Update data keys: ${Object.keys(updateData)}`);
    this.logger.debug(`Update data:`, JSON.stringify(updateData, null, 2));
    this.logger.debug(`Updating profile for user ${userId} with ${Object.keys(updateData).length} fields`);

    const updated = await this.profileModel
      .findOneAndUpdate(
        { user: userId },
        { $set: updateData },
        { upsert: true, new: true },
      )
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Profile not found');

    return updated;
  }

  async updatePhoto(userId: string, upload: UploadResult): Promise<Profile> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.profileModel.findOne({ user: userId }).lean().exec();

    const updated = await this.profileModel
      .findOneAndUpdate(
        { user: userId },
        {
          $set: {
            user: userId,
            photoUrl: upload.url,
            photoStorage: upload.provider,
            photoPublicId: upload.publicId ?? null,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .lean()
      .exec();

    if (!updated) throw new NotFoundException('Profile not found');

    // Clean up old photo if needed
    if (
      existing?.photoPublicId &&
      existing.photoPublicId !== updated.photoPublicId
    ) {
      this.cleanupPreviousPhoto(existing.photoPublicId).catch((err) =>
        this.logger.warn(`Failed cleanup for user ${userId}: ${err.message}`),
      );
    }

    return updated;
  }

  private async cleanupPreviousPhoto(publicId: string): Promise<void> {
    try {
      await this.uploadsService.remove(publicId);
    } catch (error) {
      this.logger.warn(
        `Error removing old photo ${publicId}: ${(error as Error).message}`,
      );
    }
  }
}
