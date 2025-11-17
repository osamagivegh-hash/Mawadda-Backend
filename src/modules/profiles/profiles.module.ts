import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfilesService } from './profiles.service';
import { ProfilesController } from './profiles.controller';
import { Profile } from './entities/profile.entity';
import { UsersModule } from '../users/users.module';
import { UploadsModule } from '../../uploads/uploads.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    forwardRef(() => UsersModule),
    UploadsModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
