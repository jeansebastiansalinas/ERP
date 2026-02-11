import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        role: {
            name: import("@prisma/client").$Enums.RoleName;
            createdAt: Date;
            id: number;
            description: string | null;
        };
        email: string;
        name: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
        roleId: number;
    }>;
}
