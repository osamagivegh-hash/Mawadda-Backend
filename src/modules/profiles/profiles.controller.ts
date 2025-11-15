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

  @Get(':userId')
  findOne(@Param('userId') userId: string) {
    return this.profilesService.findByUserId(userId);
  }

  @Patch(':userId')
  @UsePipes(new TrimPipe())
  update(
    @Param('userId') userId: string,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false, // Allow extra fields but ignore them
        transform: true,
        skipMissingProperties: false, // Don't skip missing properties
        skipNullProperties: false,   // Don't skip null properties  
        skipUndefinedProperties: false, // Don't skip undefined properties
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    )
    updateProfileDto: UpdateProfileDto,
  ) {
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
