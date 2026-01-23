import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly userService;
    private readonly jwtService;
    private readonly configService;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        user: {
            id: any;
            useremail: any;
            role: any;
            hederaAccountId: any;
        };
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: any;
            useremail: any;
            role: any;
            hederaAccountId: any;
        };
    }>;
    validateToken(token: string): Promise<any>;
    refreshToken(oldToken: string): Promise<{
        accessToken: string;
    }>;
    private buildAuthResponse;
}
