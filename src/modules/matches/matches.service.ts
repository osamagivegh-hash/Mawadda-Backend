import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchDocument, MatchStatus } from './schemas/match.schema';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { PreferencesService } from '../preferences/preferences.service';
import { ProfilesService } from '../profiles/profiles.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class MatchesService {
  constructor(
    @InjectModel(Match.name)
    private readonly matchModel: Model<MatchDocument>,
    private readonly profilesService: ProfilesService,
    private readonly preferencesService: PreferencesService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    requesterId: string,
    createMatchDto: CreateMatchDto,
  ): Promise<Match> {
    if (
      !Types.ObjectId.isValid(requesterId) ||
      !Types.ObjectId.isValid(createMatchDto.targetUserId)
    ) {
      throw new NotFoundException('User not found');
    }

    const [requester, target] = await Promise.all([
      this.usersService.findOne(requesterId),
      this.usersService.findOne(createMatchDto.targetUserId),
    ]);

    if (!requester) {
      throw new NotFoundException('Requester not found');
    }
    if (!target) {
      throw new NotFoundException('Target user not found');
    }

    const compatibilityScore =
      createMatchDto.compatibilityScore ??
      (await this.calculateCompatibility(
        requesterId,
        createMatchDto.targetUserId,
      ));

    const match = await this.matchModel
      .create({
        requester: requesterId,
        target: createMatchDto.targetUserId,
        status: createMatchDto.status ?? MatchStatus.PENDING,
        compatibilityScore,
        notes: createMatchDto.notes,
      })
      .catch(() => null);

    if (!match) {
      throw new NotFoundException('Unable to create match');
    }

    return match.toJSON() as Match;
  }

  findAllForUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return this.matchModel.find({ _id: null }).lean().exec();
    }
    return this.matchModel
      .find({
        $or: [{ requester: userId }, { target: userId }],
      })
      .sort({ createdAt: -1 })
      .populate('requester target', '-password')
      .lean()
      .exec();
  }

  async update(id: string, updateMatchDto: UpdateMatchDto): Promise<Match> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Match not found');
    }
    const match = await this.matchModel
      .findByIdAndUpdate(id, { $set: updateMatchDto }, { new: true })
      .lean()
      .exec();
    if (!match) {
      throw new NotFoundException('Match not found');
    }
    return match;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Match not found');
    }
    const deleted = await this.matchModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Match not found');
    }
  }

  private async calculateCompatibility(
    requesterId: string,
    targetId: string,
  ): Promise<number> {
    const [requesterProfile, targetProfile] = await Promise.all([
      this.profilesService.findByUserId(requesterId),
      this.profilesService.findByUserId(targetId),
    ]);
    const [requesterPreference, targetPreference] = await Promise.all([
      this.preferencesService
        .findAllForUser(requesterId)
        .then((prefs) => prefs[0]),
      this.preferencesService
        .findAllForUser(targetId)
        .then((prefs) => prefs[0]),
    ]);

    let score = 50;

    if (
      requesterPreference?.city &&
      requesterPreference.city === targetProfile?.city
    ) {
      score += 10;
    }

    if (
      targetPreference?.city &&
      targetPreference.city === requesterProfile?.city
    ) {
      score += 10;
    }

    if (
      requesterPreference?.religiosityLevel &&
      requesterPreference.religiosityLevel === targetProfile?.religiosityLevel
    ) {
      score += 10;
    }

    if (
      targetPreference?.religiosityLevel &&
      targetPreference.religiosityLevel === requesterProfile?.religiosityLevel
    ) {
      score += 10;
    }

    return Math.min(score, 95);
  }
}
