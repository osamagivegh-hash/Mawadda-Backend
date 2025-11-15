import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFavoriteDto } from './dto/create-favorite.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  list(@Req() request: RequestWithUser) {
    return this.favoritesService.findForUser(request.user.id);
  }

  @Post()
  create(
    @Req() request: RequestWithUser,
    @Body() createFavoriteDto: CreateFavoriteDto,
  ) {
    return this.favoritesService.add(
      request.user.id,
      createFavoriteDto.targetUserId,
    );
  }

  @Delete(':targetUserId')
  remove(
    @Req() request: RequestWithUser,
    @Param('targetUserId') targetUserId: string,
  ) {
    return this.favoritesService.remove(request.user.id, targetUserId);
  }
}




