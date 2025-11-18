import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchMembersDto } from './dto/search-members.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findMembers(
    @Req() request: RequestWithUser,
    @Query() dto: SearchMembersDto,
  ) {
    console.log('SEARCH REQUEST:', JSON.stringify(dto, null, 2));
    console.log('USER ID from request:', request.user?.id);
    console.log('USER object:', JSON.stringify(request.user, null, 2));
    console.log('USER profileId:', (request.user as any)?.profileId);

    if (!request.user?.id) {
      throw new BadRequestException('User ID not found in request. Please log in again.');
    }

    // Try to get profileId from user object if available
    const profileId = (request.user as any)?.profileId;

    const result = await this.searchService.searchMembers(
      dto,
      request.user.id,
      profileId,
    );

    console.log('API RESPONSE:', JSON.stringify(result, null, 2));

    return result;
  }
}
