import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  // 🟢 Crear orden
  async create(dto: CreateOrderDto, userId: number) {
    // 1️⃣ Validar cliente
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new BadRequestException('Cliente no existe');
    }

    // 2️⃣ Validar producto
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new BadRequestException('Producto no existe');
    }

    // 3️⃣ Calcular total
    const totalPrice = Number(product.price) * dto.quantity;

    // 4️⃣ Crear orden
    return this.prisma.order.create({
      data: {
        quantity: dto.quantity,
        totalPrice,
        clientId: client.id,
        productId: product.id,
        createdById: userId,
      },
      include: {
        client: true,
        product: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  // 🔵 Listar órdenes
  async findAll() {
    return this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        product: true,
        createdBy: true,
      },
    });
  }

  // 🟡 ACTUALIZAR ESTADO DE ORDEN (NUEVO)
  async updateStatus(orderId: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    // Reglas de negocio
    if (order.status === OrderStatus.DELIVERED) {
  throw new BadRequestException(
    'Esta orden no puede ser modificada',
  );
}


    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }
}
