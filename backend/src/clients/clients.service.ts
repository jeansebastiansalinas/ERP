import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto'; // ✅ CORRECTO

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    const existing = await this.prisma.client.findUnique({
      where: { taxId: dto.taxId },
    });

    if (existing) {
      throw new BadRequestException('Cliente ya existe');
    }

    return this.prisma.client.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.client.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}