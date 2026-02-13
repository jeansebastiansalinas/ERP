import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
export declare class ClientsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(dto: CreateClientDto): Promise<{
        id: number;
        createdAt: Date;
        isActive: boolean;
        businessName: string;
        taxId: string;
        country: string;
        city: string;
    }>;
    findAll(): Promise<{
        id: number;
        createdAt: Date;
        isActive: boolean;
        businessName: string;
        taxId: string;
        country: string;
        city: string;
    }[]>;
}
