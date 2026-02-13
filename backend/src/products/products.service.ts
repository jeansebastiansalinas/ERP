import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Producto ya existe');
    }

    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        unit: dto.unit,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
