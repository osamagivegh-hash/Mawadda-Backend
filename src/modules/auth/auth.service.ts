import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ProfilesService } from '../profiles/profiles.service';
import { UserStatus } from '../users/schemas/user.schema';
import type { SafeUser } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly profilesService: ProfilesService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const safeUser = await this.usersService.create(registerDto);

    // Ensure the user's basic profile is initialized on registration
    const profile = await this.profilesService.update(safeUser.id, {
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      guardianName: registerDto.guardianName,
      guardianContact: registerDto.guardianContact,
    });

    // Ensure user status is ACTIVE after profile creation
    await this.usersService.update(safeUser.id, {
      status: UserStatus.ACTIVE,
    });

    const profileId =
      (profile as { id?: string }).id ??
      // Fallback for lean documents without virtuals
      ((profile as { _id?: { toString: () => string } })._id?.toString() ??
        null);

    return {
      user: {
        ...safeUser,
        // Expose canonical identifiers for the frontend
        id: safeUser.id,
        profileId,
      },
      token: await this.generateToken(safeUser),
    };
  }

  async login(loginDto: LoginDto) {
    const userDocument = await this.usersService.findByEmail(loginDto.email);
    if (!userDocument) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      userDocument.password,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const safeUser = this.usersService.sanitizeUser(userDocument);

    // Look up existing profile for this user so the frontend can
    // reliably load the correct profile document after login
    const existingProfile = await this.profilesService.findByUserId(
      safeUser.id,
    );

    const profileId =
      (existingProfile as { id?: string } | null)?.id ??
      ((existingProfile as { _id?: { toString: () => string } } | null)?._id?.toString() ??
        null);

    return {
      user: {
        ...safeUser,
        id: safeUser.id,
        profileId,
      },
      token: await this.generateToken(safeUser),
    };
  }

  private async generateToken(user: SafeUser) {
    return this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }
}
