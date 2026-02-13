import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    create(dto: CreateOrderDto, req: any): Promise<{
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
    updateStatus(id: string, dto: UpdateOrderStatusDto): Promise<{
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
