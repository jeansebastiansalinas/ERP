import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
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
