import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Client, PrivateKey } from '@hashgraph/sdk';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly hederaClient: Client;

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.hederaClient = this.createHederaClient();
  }

  private createHederaClient(): Client {
    const operatorId = this.configService.get<string>('HEDERA_OPERATOR_ID');
    const operatorKeyRaw = this.configService.get<string>('HEDERA_OPERATOR_KEY');

    if (!operatorId || !operatorKeyRaw) {
      return Client.forTestnet();
    }

    let operatorKey: PrivateKey;
    try {
      operatorKey = PrivateKey.fromStringECDSA(operatorKeyRaw);
    } catch (error) {
      throw new UnauthorizedException(
        `Invalid HEDERA_OPERATOR_KEY: ${(error as Error).message}`,
      );
    }

    return Client.forTestnet().setOperator(operatorId, operatorKey);
  }

  async register(dto: RegisterDto) {
    const role = dto.role ?? 'investor';
    const user = await this.userService.createUser(
      dto.useremail,
      dto.password,
      this.hederaClient,
      role,
    );

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userService.login(dto.useremail, dto.password);
    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: any) {
    const payload = {
      sub: user._id?.toString?.() ?? user.id,
      useremail: user.useremail,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        useremail: user.useremail,
        role: user.role,
        hederaAccountId: user.hederaAccountId,
        hederaEVMAccount: user.hederaEVMAccount,
      },
    };
  }
}
