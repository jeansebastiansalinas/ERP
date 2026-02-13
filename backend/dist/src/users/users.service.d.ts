import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '@prisma/client';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findByEmail(email: string): import("@prisma/client").Prisma.Prisma__UserClient<{
        id: number;
        name: string | null;
        createdAt: Date;
        email: string;
        passwordHash: string;
        isActive: boolean;
        roleId: number;
        updatedAt: Date;
    } | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    findByEmailWithRole(email: string): import("@prisma/client").Prisma.Prisma__UserClient<({
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
            description: string | null;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string | null;
        createdAt: Date;
        email: string;
        passwordHash: string;
        isActive: boolean;
        roleId: number;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    createUser(data: {
        email: string;
        passwordHash: string;
        name?: string;
        role: RoleName;
    }): import("@prisma/client").Prisma.Prisma__UserClient<{
        role: {
            id: number;
            name: import("@prisma/client").$Enums.RoleName;
            description: string | null;
            createdAt: Date;
        };
    } & {
        id: number;
        name: string | null;
        createdAt: Date;
        email: string;
        passwordHash: string;
        isActive: boolean;
        roleId: number;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
}
