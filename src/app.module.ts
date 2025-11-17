import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { MatchesModule } from './modules/matches/matches.module';
import { ConsultationsModule } from './modules/consultations/consultations.module';
import { SearchModule } from './modules/search/search.module';
import { ConsultantsModule } from './modules/consultants/consultants.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { MembershipModule } from './modules/membership/membership.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { UploadsModule } from './uploads/uploads.module';
import { ExamsModule } from './modules/exams/exams.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { User } from './modules/users/entities/user.entity';
import { Profile } from './modules/profiles/entities/profile.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    AuthModule,
    ProfilesModule,
    PreferencesModule,
    MatchesModule,
    ConsultationsModule,
    SearchModule,
    ConsultantsModule,
    FavoritesModule,
    MembershipModule,
    DashboardModule,
    UploadsModule,
    ExamsModule,
    PaymentsModule,
  ],
})
export class AppModule {}
