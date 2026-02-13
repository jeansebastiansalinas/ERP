import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async generateFromOrder(orderId: number) {
    // 1️⃣ Buscar orden
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        product: true,
        invoice: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Orden no existe');
    }

    // 2️⃣ Validar estado
    if (order.status !== 'APPROVED') {
      throw new BadRequestException(
        'Solo se pueden facturar órdenes aprobadas',
      );
    }

    // 3️⃣ Validar factura previa
    if (order.invoice) {
      throw new BadRequestException('Esta orden ya fue facturada');
    }

    // 4️⃣ Crear factura
    return this.prisma.invoice.create({
      data: {
        orderId: order.id,
        clientName: order.client.businessName,
        productName: order.product.name,
        unitPrice: order.product.price,
        quantity: order.quantity,
        totalAmount: order.totalPrice,
      },
    });
  }

  async findAll() {
    return this.prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
