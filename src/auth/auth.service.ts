import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const role = dto.role ?? 'investor';
    const isKYC = dto.isKYC ?? false;
    // Create user with the Hedera account ID from their connected wallet
    const user = await this.userService.createUser(
      dto.useremail,
      dto.password,
      dto.accountId,
      role,
      isKYC
    );

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.login(dto.useremail, dto.password);
    return this.buildAuthResponse(user);
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async refreshToken(oldToken: string) {
    try {
      const payload = this.jwtService.verify(oldToken);
      
      // Create new token with same payload
      const newPayload = {
        sub: payload.sub,
        useremail: payload.useremail,
        role: payload.role,
      };

      const accessToken = this.jwtService.sign(newPayload);
      
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private buildAuthResponse(user: any) {
    const payload = {
      sub: user._id?.toString?.() ?? user.id,
      useremail: user.useremail,
      role: user.role,
      hederaAccountId: user.hederaAccountId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user._id?.toString?.() ?? user.id,
        useremail: user.useremail,
        role: user.role,
        hederaAccountId: user.hederaAccountId,
      },
    };
  }
}