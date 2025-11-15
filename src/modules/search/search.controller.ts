import { Controller, Get, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchMembersDto } from './dto/search-members.dto';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('debug')
  async debugProfiles() {
    return this.searchService.debugProfiles();
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMembers(
    @Req() request: RequestWithUser,
    @Query() filters: SearchMembersDto,
  ) {
    // Validate required fields
    if (!filters.gender) {
      throw new BadRequestException('Gender is required for search');
    }

    if (!filters.minAge && !filters.maxAge) {
      throw new BadRequestException('Age range (minAge or maxAge) is required for search');
    }

    // Validate age range
    if (filters.minAge && filters.maxAge && filters.minAge > filters.maxAge) {
      throw new BadRequestException('Minimum age cannot be greater than maximum age');
    }

    console.log('Search filters received:', filters);
    console.log('User ID:', request.user?.id);
    
    return this.searchService.searchMembers(filters, request.user?.id);
  }
}
