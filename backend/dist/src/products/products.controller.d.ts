import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
