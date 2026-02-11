import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
export declare class AuthService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
