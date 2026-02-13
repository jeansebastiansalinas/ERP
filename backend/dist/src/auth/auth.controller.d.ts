import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
