import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { EstadoOferta, TipoProducto } from '@prisma/client';

@Injectable()
export class SolicitudesService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════════
  // CREAR SOLICITUD (Solo COMPRADORES)
  // ════════════════════════════════════════════════
  async create(dto: CreateSolicitudDto, compradorId: number) {
    return this.prisma.solicitudCompra.create({
      data: {
        ...dto,
        precioMaximo: dto.precioMaximo,
        fechaRequerida:  new Date(dto.fechaRequerida),
        fechaExpiracion: dto.fechaExpiracion
          ? new Date(dto.fechaExpiracion)
          : null,
        compradorId,
      },
      include: {
        comprador: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // ════════════════════════════════════════════════
  // LISTAR TODAS LAS SOLICITUDES ACTIVAS
  // ════════════════════════════════════════════════
  async findAll(filters?: {
    tipoProducto?: TipoProducto;
    ciudad?: string;
  }) {
    return this.prisma.solicitudCompra.findMany({
      where: {
        estado: EstadoOferta.ACTIVA,
        ...(filters?.tipoProducto && { tipoProducto: filters.tipoProducto }),
        ...(filters?.ciudad && { ciudad: filters.ciudad }),
      },
      include: {
        comprador: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // MIS SOLICITUDES (Solo del comprador actual)
  // ════════════════════════════════════════════════
  async findMisSolicitudes(compradorId: number) {
    return this.prisma.solicitudCompra.findMany({
      where: { compradorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // OBTENER UNA SOLICITUD POR ID
  // ════════════════════════════════════════════════
  async findOne(id: string) {
    const solicitud = await this.prisma.solicitudCompra.findUnique({
      where: { id },
      include: {
        comprador: {
          select: { id: true, name: true, email: true },
        },
      },
    });
    if (!solicitud) {
      throw new NotFoundException(`Solicitud con ID ${id} no encontrada`);
    }
    return solicitud;
  }

  // ════════════════════════════════════════════════
  // ACTUALIZAR SOLICITUD (Solo el dueño)
  // ════════════════════════════════════════════════
  async update(id: string, dto: UpdateSolicitudDto, userId: number) {
    const solicitud = await this.findOne(id);
    if (solicitud.compradorId !== userId) {
      throw new ForbiddenException('No puedes editar solicitudes de otros compradores');
    }
    return this.prisma.solicitudCompra.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.fechaRequerida  && { fechaRequerida:  new Date(dto.fechaRequerida) }),
        ...(dto.fechaExpiracion && { fechaExpiracion: new Date(dto.fechaExpiracion) }),
      },
      include: {
        comprador: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // ════════════════════════════════════════════════
  // ELIMINAR SOLICITUD (Solo el dueño)
  // ════════════════════════════════════════════════
  async remove(id: string, userId: number) {
    const solicitud = await this.findOne(id);
    if (solicitud.compradorId !== userId) {
      throw new ForbiddenException('No puedes eliminar solicitudes de otros compradores');
    }
    return this.prisma.solicitudCompra.delete({ where: { id } });
  }
}