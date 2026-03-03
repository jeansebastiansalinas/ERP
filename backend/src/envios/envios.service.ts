import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EstadoEnvio } from '@prisma/client';

@Injectable()
export class EnviosService {
  constructor(private prisma: PrismaService) {}

  private includeCompleto = {
    negociacion: {
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
        factura: true,
      },
    },
  };

  // ════════════════════════════════════════════════
  // Envíos donde el usuario es vendedor o comprador
  // ════════════════════════════════════════════════
  async findMisEnvios(userId: number) {
    return this.prisma.envio.findMany({
      where: {
        negociacion: {
          OR: [{ vendedorId: userId }, { compradorId: userId }],
        },
      },
      include: this.includeCompleto,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // Todos los envíos (Admin)
  // ════════════════════════════════════════════════
  async findAll() {
    return this.prisma.envio.findMany({
      include: this.includeCompleto,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // Un envío por ID
  // ════════════════════════════════════════════════
  async findOne(id: string) {
    const envio = await this.prisma.envio.findUnique({
      where: { id },
      include: this.includeCompleto,
    });
    if (!envio) throw new NotFoundException(`Envío ${id} no encontrado`);
    return envio;
  }

  // ════════════════════════════════════════════════
  // ADMIN — Cambiar estado del envío
  // ════════════════════════════════════════════════
  async cambiarEstado(id: string, data: {
    estadoEnvio: EstadoEnvio;
    conductorNombre?: string;
    conductorTelefono?: string;
    vehiculoPlaca?: string;
    progresoEstimado?: number;
    observaciones?: string;
  }) {
    await this.findOne(id);

    const progresoPorEstado: Record<string, number> = {
      PENDIENTE: 5, PAGADO: 25, EN_PREPARACION: 50,
      EN_TRANSITO: 75, ENTREGADO: 100, CANCELADO: 0,
    };

    const updateData: any = {
      estadoEnvio: data.estadoEnvio,
      progresoEstimado: data.progresoEstimado ?? progresoPorEstado[data.estadoEnvio],
    };

    if (data.conductorNombre)   updateData.conductorNombre   = data.conductorNombre;
    if (data.conductorTelefono) updateData.conductorTelefono = data.conductorTelefono;
    if (data.vehiculoPlaca)     updateData.vehiculoPlaca     = data.vehiculoPlaca;
    if (data.observaciones)     updateData.observaciones     = data.observaciones;
    if (data.estadoEnvio === 'EN_TRANSITO') updateData.fechaSalida = new Date();
    if (data.estadoEnvio === 'ENTREGADO')   updateData.fechaEntregaReal = new Date();

    const envio = await this.prisma.envio.update({
      where: { id },
      data: updateData,
      include: this.includeCompleto,
    });

    // Si se marcó ENTREGADO → completar negociación
    if (data.estadoEnvio === 'ENTREGADO') {
      await this.prisma.negociacion.update({
        where: { id: envio.negociacion.id },
        data: { estado: 'COMPLETADA' },
      });

      // Notificar a ambas partes
      await this.prisma.notificacion.createMany({
        data: [
          {
            usuarioId: envio.negociacion.vendedorId,
            tipo: 'PROPUESTA_ACEPTADA',
            titulo: '¡Entrega confirmada! 🎉',
            mensaje: `El envío fue marcado como entregado. Los fondos serán liberados a tu cuenta.`,
            negociacionId: envio.negociacion.id,
          },
          {
            usuarioId: envio.negociacion.compradorId,
            tipo: 'PROPUESTA_ACEPTADA',
            titulo: '¡Entrega confirmada! 🎉',
            mensaje: `Tu pedido de ${envio.negociacion.tipoProducto} fue entregado exitosamente.`,
            negociacionId: envio.negociacion.id,
          },
        ],
      });
    }

    return envio;
  }
}