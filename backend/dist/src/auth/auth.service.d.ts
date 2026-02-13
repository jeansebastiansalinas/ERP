import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
            description: string | null;
            createdAt: Date;
        };
        id: number;
        name: string | null;
        createdAt: Date;
        email: string;
        isActive: boolean;
        roleId: number;
        updatedAt: Date;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        user: {
            id: number;
            email: string;
            name: string | null;
            role: import("@prisma/client").$Enums.RoleName;
        };
    }>;
}
