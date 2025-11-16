import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  ParseFilePipeBuilder,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { uploadMulterOptions } from '../../uploads/uploads.config';
import { UploadsService } from '../../uploads/uploads.service';
import { TrimPipe } from '../../common/pipes/trim.pipe';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get('me')
  async getMyProfile(@Req() request: RequestWithUser) {
    // Use the authenticated user's id from JWT to load their profile.
    // This avoids relying on any client-provided identifiers.
    return this.profilesService.findByUserId(request.user.id);
  }

  @Post()
  @UsePipes(new TrimPipe())
  async createProfile(
    @Req() request: RequestWithUser,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    createProfileDto: CreateProfileDto,
  ) {
    return this.profilesService.create(request.user.id, createProfileDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // For backwards-compatibility, this endpoint now supports both:
    // - GET /profiles/{profileId}  -> lookup by profile document id
    // - GET /profiles/{userId}     -> fallback lookup by user reference
    // This allows the frontend to safely use a dedicated profileId while
    // keeping legacy "userId as path param" behavior working.
    return this.profilesService.findByIdOrUserId(id);
  }

  @Patch(':userId')
  @UsePipes(new TrimPipe())
  update(
    @Param('userId') userId: string,
    @Body(
      new ValidationPipe({
        whitelist: false, // CRITICAL: Don't whitelist - accept all fields
        forbidNonWhitelisted: false,
        transform: true,
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
        stopAtFirstError: false,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    updateProfileDto: UpdateProfileDto & Record<string, any>, // Allow extra fields
  ) {
    // Log what we received
    console.log('=== CONTROLLER RECEIVED ===');
    console.log('DTO keys:', Object.keys(updateProfileDto));
    console.log('DTO:', JSON.stringify(updateProfileDto, null, 2));
    return this.profilesService.update(userId, updateProfileDto);
  }

  @Patch(':userId/photo')
  @UseInterceptors(FileInterceptor('photo', uploadMulterOptions))
  async updatePhoto(
    @Param('userId') userId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024, // 5MB fixed limit
        })
        .build({ fileIsRequired: true }),
    )
    file: Express.Multer.File,
  ) {
    const uploadResult = await this.uploadsService.upload(file);
    return this.profilesService.updatePhoto(userId, uploadResult);
  }
}
