import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from './schemas/favorite.schema';
import { UsersService } from '../users/users.service';
import { ProfilesService } from '../profiles/profiles.service';
import { UserRole } from '../users/schemas/user.schema';

type PopulatedFavorite = Favorite & {
  _id: Types.ObjectId;
  createdAt?: Date;
  target: {
    _id: Types.ObjectId;
    email: string;
    role: UserRole;
  };
};

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name)
    private readonly favoriteModel: Model<FavoriteDocument>,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
  ) {}

  async add(userId: string, targetUserId: string, note?: string) {
    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(targetUserId)
    ) {
      throw new NotFoundException('User not found');
    }
    if (userId === targetUserId) {
      throw new ConflictException('Cannot add yourself to favorites');
    }

    const [user, target] = await Promise.all([
      this.usersService.findOne(userId),
      this.usersService.findOne(targetUserId),
    ]);

    if (!user || !target) {
      throw new NotFoundException('User not found');
    }

    await this.favoriteModel.updateOne(
      { user: userId, target: targetUserId },
      { $setOnInsert: { user: userId, target: targetUserId }, $set: { note } },
      { upsert: true },
    );

    return this.findForUser(userId);
  }

  async remove(userId: string, targetUserId: string) {
    await this.favoriteModel
      .findOneAndDelete({ user: userId, target: targetUserId })
      .exec();
    return this.findForUser(userId);
  }

  async findForUser(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      return [];
    }
    const favorites = (await this.favoriteModel
      .find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('target', 'email role')
      .lean()
      .exec()) as unknown as PopulatedFavorite[];

    const results = await Promise.all(
      favorites.map(async (favorite) => {
        const profile = await this.profilesService.findByUserId(
          favorite.target._id.toString(),
        );
        return {
          id: favorite._id.toString(),
          createdAt: favorite.createdAt,
          note: favorite.note,
          target: {
            id: favorite.target._id.toString(),
            email: favorite.target.email,
            role: favorite.target.role,
            profile,
          },
        };
      }),
    );

    return results;
  }
}
