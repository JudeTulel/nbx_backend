import { UserService } from './users.service';
export declare class CreateUserDto {
    useremail: string;
    password: string;
    hederaAccountId: string;
    role?: string;
}
export declare class LoginDto {
    useremail: string;
    password: string;
}
export declare class UpdatePasswordDto {
    currentPassword: string;
    newPassword: string;
}
export declare class UpdateRoleDto {
    newRole: string;
}
export declare class UserController {
    private readonly userService;
    constructor(userService: UserService);
    register(createUserDto: CreateUserDto): Promise<{
        message: string;
        user: {
            id: unknown;
            useremail: string;
            role: string;
            hederaAccountId: string;
            createdAt: Date | undefined;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        message: string;
        user: {
            id: unknown;
            useremail: string;
            role: string;
            hederaAccountId: string;
            lastLogin: Date | undefined;
        };
    }>;
    getProfile(useremail: string): Promise<{
        user: Partial<import("./users.schema").User>;
    }>;
    getByHederaAccount(accountId: string): Promise<{
        user: {
            id: unknown;
            useremail: string;
            role: string;
            hederaAccountId: string;
        };
    }>;
    updatePassword(useremail: string, updatePasswordDto: UpdatePasswordDto): Promise<{
        message: string;
    }>;
    updateRole(useremail: string, updateRoleDto: UpdateRoleDto): Promise<{
        message: string;
        user: {
            id: unknown;
            useremail: string;
            role: string;
        };
    }>;
    deleteUser(useremail: string): Promise<{
        message: string;
    }>;
}
