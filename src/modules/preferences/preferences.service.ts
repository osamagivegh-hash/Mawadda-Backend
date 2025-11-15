import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Preference, PreferenceDocument } from './schemas/preference.schema';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';

@Injectable()
export class PreferencesService {
  constructor(
    @InjectModel(Preference.name)
    private readonly preferenceModel: Model<PreferenceDocument>,
  ) {}

  async findAllForUser(userId: string): Promise<Preference[]> {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }
    const preference = await this.preferenceModel
      .findOne({ user: userId })
      .lean()
      .exec();
    return preference ? [preference] : [];
  }

  async upsert(userId: string, dto: UpsertPreferenceDto): Promise<Preference> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('User not found');
    }

    const preference = await this.preferenceModel
      .findOneAndUpdate(
        { user: userId },
        { $set: { ...dto, user: userId } },
        { upsert: true, new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!preference) {
      throw new NotFoundException('Preference not found');
    }
    return preference;
  }
}
