import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
export declare class ProductsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateProductDto): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        isActive: boolean;
        price: import("@prisma/client/runtime/library").Decimal;
        unit: string;
    }>;
    findAll(): Promise<{
        id: number;
        name: string;
        createdAt: Date;
        isActive: boolean;
        price: import("@prisma/client/runtime/library").Decimal;
        unit: string;
    }[]>;
}
