import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
export declare class OrdersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateOrderDto, userId: number): Promise<{
        client: {
            id: number;
            createdAt: Date;
            isActive: boolean;
            businessName: string;
            taxId: string;
            country: string;
            city: string;
        };
        product: {
            id: number;
            name: string;
            createdAt: Date;
            isActive: boolean;
            price: import("@prisma/client/runtime/library").Decimal;
            unit: string;
        };
        createdBy: {
            id: number;
            role: {
                id: number;
                name: import("@prisma/client").$Enums.RoleName;
                description: string | null;
                createdAt: Date;
            };
            email: string;
        };
    } & {
        id: number;
        createdAt: Date;
        clientId: number;
        productId: number;
        quantity: number;
        totalPrice: number;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdById: number;
    }>;
    findAll(): Promise<({
        client: {
            id: number;
            createdAt: Date;
            isActive: boolean;
            businessName: string;
            taxId: string;
            country: string;
            city: string;
        };
        product: {
            id: number;
            name: string;
            createdAt: Date;
            isActive: boolean;
            price: import("@prisma/client/runtime/library").Decimal;
            unit: string;
        };
        createdBy: {
            id: number;
            name: string | null;
            createdAt: Date;
            email: string;
            passwordHash: string;
            isActive: boolean;
            roleId: number;
            updatedAt: Date;
        };
    } & {
        id: number;
        createdAt: Date;
        clientId: number;
        productId: number;
        quantity: number;
        totalPrice: number;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdById: number;
    })[]>;
    updateStatus(orderId: number, status: OrderStatus): Promise<{
        id: number;
        createdAt: Date;
        clientId: number;
        productId: number;
        quantity: number;
        totalPrice: number;
        status: import("@prisma/client").$Enums.OrderStatus;
        createdById: number;
    }>;
}
