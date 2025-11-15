import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpsertPreferenceDto } from './dto/upsert-preference.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Get(':userId')
  findAll(@Param('userId') userId: string) {
    return this.preferencesService.findAllForUser(userId);
  }

  @Put(':userId')
  upsert(
    @Param('userId') userId: string,
    @Body() upsertPreferenceDto: UpsertPreferenceDto,
  ) {
    return this.preferencesService.upsert(userId, upsertPreferenceDto);
  }
}




