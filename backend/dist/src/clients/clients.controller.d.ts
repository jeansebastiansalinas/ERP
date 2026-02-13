import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
export declare class ClientsController {
    private readonly clientsService;
    constructor(clientsService: ClientsService);
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
