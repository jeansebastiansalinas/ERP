import { PrismaService } from '../prisma/prisma.service';
export declare class InvoicesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateFromOrder(orderId: number): Promise<{
        id: number;
        createdAt: Date;
        quantity: number;
        orderId: number;
        clientName: string;
        productName: string;
        unitPrice: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        quantity: number;
        orderId: number;
        clientName: string;
        productName: string;
        unitPrice: import("@prisma/client/runtime/library").Decimal;
        totalAmount: import("@prisma/client/runtime/library").Decimal;
    }[]>;
}
