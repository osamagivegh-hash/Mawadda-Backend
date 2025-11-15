import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ProfilesService } from '../profiles/profiles.service';
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

    await this.profilesService.update(safeUser.id, {
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      guardianName: registerDto.guardianName,
      guardianContact: registerDto.guardianContact,
    });

    return {
      user: safeUser,
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

    return {
      user: safeUser,
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
