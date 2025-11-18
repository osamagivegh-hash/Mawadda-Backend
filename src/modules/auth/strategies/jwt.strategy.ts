import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { ProfilesService } from '../../profiles/profiles.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  profileId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException();
    }
    
    // Get profileId from JWT payload or fetch from database
    let profileId = payload.profileId;
    
    // If profileId not in JWT, try to find it from database
    if (!profileId) {
      const profile = await this.profilesService.findByUserId(payload.sub);
      if (profile) {
        profileId = (profile as any).id || (profile as any)._id?.toString();
      }
    }
    
    return {
      ...user,
      id: user.id,
      profileId,
    };
  }
}
