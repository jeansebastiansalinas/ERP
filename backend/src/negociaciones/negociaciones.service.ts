import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNegociacionDto } from './dto/create-negociacion.dto';
import { UpdateNegociacionDto } from './dto/update-negociacion.dto';
import { EstadoNegociacion } from '@prisma/client';

@Injectable()
export class NegociacionesService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════════
  // CREAR NEGOCIACIÓN + NOTIFICAR CONTRAPARTE
  // ════════════════════════════════════════════════
  async create(createNegociacionDto: CreateNegociacionDto) {
    if (!createNegociacionDto.ofertaId && !createNegociacionDto.solicitudId) {
      throw new BadRequestException('Debe especificar una oferta o solicitud');
    }

    if (createNegociacionDto.ofertaId) {
      const oferta = await this.prisma.ofertaVenta.findUnique({
        where: { id: createNegociacionDto.ofertaId },
      });
      if (!oferta) throw new NotFoundException('Oferta no encontrada');
    }

    if (createNegociacionDto.solicitudId) {
      const solicitud = await this.prisma.solicitudCompra.findUnique({
        where: { id: createNegociacionDto.solicitudId },
      });
      if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    }

    const negociacion = await this.prisma.negociacion.create({
      data: {
        ...createNegociacionDto,
        precioUnitario: createNegociacionDto.precioUnitario,
        costoFlete: createNegociacionDto.costoFlete || 0,
      },
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
        oferta: true,
        solicitud: true,
      },
    });

    // ── Notificar a la contraparte ──────────────────
    // solicitudId  → vendedor contactó al comprador  → notificar al COMPRADOR
    // ofertaId     → comprador contactó al vendedor  → notificar al VENDEDOR
    const destinatarioId = createNegociacionDto.solicitudId
      ? negociacion.compradorId
      : negociacion.vendedorId;

    const remitenteNombre = createNegociacionDto.solicitudId
      ? negociacion.vendedor.name
      : negociacion.comprador.name;

    await this.prisma.notificacion.create({
      data: {
        usuarioId: destinatarioId,
        tipo: 'NUEVA_PROPUESTA',
        titulo: 'Nueva propuesta recibida 📦',
        mensaje: `${remitenteNombre} te envió una propuesta de ${negociacion.cantidad.toLocaleString()} galones a $${Number(negociacion.precioUnitario).toFixed(2)}/gal.`,
        negociacionId: negociacion.id,
      },
    });

    return negociacion;
  }

  // ════════════════════════════════════════════════
  // LISTAR TODAS LAS NEGOCIACIONES (Admin)
  // ════════════════════════════════════════════════
  async findAll(filters?: {
    estado?: EstadoNegociacion;
    vendedorId?: number;
    compradorId?: number;
  }) {
    return this.prisma.negociacion.findMany({
      where: {
        ...(filters?.estado && { estado: filters.estado }),
        ...(filters?.vendedorId && { vendedorId: filters.vendedorId }),
        ...(filters?.compradorId && { compradorId: filters.compradorId }),
      },
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
        oferta: true,
        solicitud: true,
        envio: true,
        factura: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // MIS NEGOCIACIONES (vendedor o comprador)
  // ════════════════════════════════════════════════
  async findMyNegociaciones(userId: number) {
    // userId viene de req.user.sub (JWT payload: { sub: user.id })
    const id = Number(userId);
    return this.prisma.negociacion.findMany({
      where: {
        OR: [{ vendedorId: id }, { compradorId: id }],
      },
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
        oferta: true,
        solicitud: true,
        envio: true,
        factura: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // OBTENER UNA POR ID
  // ════════════════════════════════════════════════
  async findOne(id: string) {
    const negociacion = await this.prisma.negociacion.findUnique({
      where: { id },
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
        oferta: true,
        solicitud: true,
        envio: true,
        factura: true,
      },
    });

    if (!negociacion) {
      throw new NotFoundException(`Negociación ${id} no encontrada`);
    }

    return negociacion;
  }

  // ════════════════════════════════════════════════
  // ACTUALIZAR
  // ════════════════════════════════════════════════
  async update(id: string, updateNegociacionDto: UpdateNegociacionDto, userId: number) {
    const negociacion = await this.findOne(id);

    if (negociacion.vendedorId !== userId && negociacion.compradorId !== userId) {
      throw new ForbiddenException('No tienes permiso para actualizar esta negociación');
    }

    return this.prisma.negociacion.update({
      where: { id },
      data: updateNegociacionDto,
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
        oferta: true,
        solicitud: true,
        envio: true,
        factura: true,
      },
    });
  }

  // ════════════════════════════════════════════════
  // ACEPTAR → crea Envío + Factura + notifica comprador
  // ════════════════════════════════════════════════
  async aceptar(id: string, vendedorId: number, notasVendedor?: string) {
    const negociacion = await this.findOne(id);

    if (negociacion.vendedorId !== vendedorId) {
      throw new ForbiddenException('Solo el vendedor puede aceptar esta negociación');
    }

    if (negociacion.estado !== EstadoNegociacion.ESPERANDO_CONFIRMACION) {
      throw new BadRequestException('La negociación no está esperando confirmación');
    }

    // 1. Marcar como CONFIRMADA
    const negociacionActualizada = await this.prisma.negociacion.update({
      where: { id },
      data: { estado: EstadoNegociacion.CONFIRMADA, notasVendedor },
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
      },
    });

    // 2. Crear Envío automáticamente
    const origenTexto = negociacion.oferta?.ubicacion
      ?? negociacion.solicitud?.ciudad
      ?? negociacion.ciudad;

    await this.prisma.envio.create({
      data: {
        negociacionId: id,
        origen: origenTexto,
        destino: negociacion.direccionEntrega,
        estadoEnvio: 'PENDIENTE',
        fechaEntregaEst: negociacion.solicitud?.fechaRequerida ?? null,
      },
    });

    // 3. Crear Factura automáticamente
    const subtotal = Number(negociacion.cantidad) * Number(negociacion.precioUnitario);
    const costoFlete = Number(negociacion.costoFlete ?? 0);
    const comisionPlataforma = subtotal * 0.02; // 2% de comisión
    const total = subtotal + costoFlete + comisionPlataforma;

    await this.prisma.factura.create({
      data: {
        negociacionId: id,
        subtotal,
        costoFlete,
        comisionPlataforma,
        total,
        estadoPago: 'PENDIENTE',
      },
    });

    // 4. Notificar al comprador
    await this.prisma.notificacion.create({
      data: {
        usuarioId: negociacion.compradorId,
        tipo: 'PROPUESTA_ACEPTADA',
        titulo: '¡Tu propuesta fue aceptada! 🎉',
        mensaje: `${negociacion.vendedor.name} aceptó tu solicitud de ${negociacion.cantidad.toLocaleString()} galones a $${Number(negociacion.precioUnitario).toFixed(2)}/gal. Revisa tu envío en progreso.`,
        negociacionId: id,
      },
    });

    return negociacionActualizada;
  }

  // ════════════════════════════════════════════════
  // RECHAZAR + notifica comprador
  // ════════════════════════════════════════════════
  async rechazar(id: string, vendedorId: number, motivo?: string) {
    const negociacion = await this.findOne(id);

    if (negociacion.vendedorId !== vendedorId) {
      throw new ForbiddenException('Solo el vendedor puede rechazar esta negociación');
    }

    const negociacionActualizada = await this.prisma.negociacion.update({
      where: { id },
      data: { estado: EstadoNegociacion.RECHAZADA, notasVendedor: motivo },
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
      },
    });

    // Notificar al comprador
    await this.prisma.notificacion.create({
      data: {
        usuarioId: negociacion.compradorId,
        tipo: 'PROPUESTA_RECHAZADA',
        titulo: 'Propuesta rechazada ❌',
        mensaje: motivo
          ? `Tu propuesta fue rechazada. Motivo: ${motivo}`
          : `${negociacion.vendedor.name} rechazó tu propuesta de ${negociacion.cantidad.toLocaleString()} galones.`,
        negociacionId: id,
      },
    });

    return negociacionActualizada;
  }

  // ════════════════════════════════════════════════
  // CANCELAR (comprador cancela) + notifica vendedor
  // ════════════════════════════════════════════════
  async cancelar(id: string, compradorId: number, motivo?: string) {
    const negociacion = await this.findOne(id);

    if (negociacion.compradorId !== compradorId) {
      throw new ForbiddenException('Solo el comprador puede cancelar esta negociación');
    }

    const negociacionActualizada = await this.prisma.negociacion.update({
      where: { id },
      data: { estado: EstadoNegociacion.CANCELADA, notasComprador: motivo },
      include: {
        vendedor: { select: { id: true, name: true, email: true } },
        comprador: { select: { id: true, name: true, email: true } },
      },
    });

    // Notificar al vendedor
    await this.prisma.notificacion.create({
      data: {
        usuarioId: negociacion.vendedorId,
        tipo: 'PROPUESTA_RECHAZADA',
        titulo: 'Propuesta cancelada',
        mensaje: motivo
          ? `${negociacion.comprador.name} canceló la propuesta. Motivo: ${motivo}`
          : `${negociacion.comprador.name} canceló la propuesta de ${negociacion.cantidad.toLocaleString()} galones.`,
        negociacionId: id,
      },
    });

    return negociacionActualizada;
  }

  // ════════════════════════════════════════════════
  // ELIMINAR (Solo admin)
  // ════════════════════════════════════════════════
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.negociacion.delete({ where: { id } });
  }
}