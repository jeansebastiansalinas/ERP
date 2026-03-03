import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNegociacionDto } from './dto/create-negociacion.dto';
import { UpdateNegociacionDto } from './dto/update-negociacion.dto';
import { EstadoNegociacion } from '@prisma/client';

@Injectable()
export class NegociacionesService {
  constructor(private prisma: PrismaService) {}

  // ─── include reutilizable ────────────────────────────────────────────────────
  private readonly inc = {
    vendedor:  { select: { id: true, name: true, email: true } },
    comprador: { select: { id: true, name: true, email: true } },
    oferta:    true,   // ofertaId se incluye automáticamente como campo escalar
    solicitud: true,   // solicitudId igual
    envio:     true,
    factura:   true,
  };

  // Nota: Prisma siempre retorna los campos escalares (ofertaId, solicitudId)
  // junto con las relaciones incluidas — no es necesario declararlos extra.

  // ════════════════════════════════════════════════
  // CREAR + notificar contraparte
  // ════════════════════════════════════════════════
  async create(dto: CreateNegociacionDto) {
    if (!dto.ofertaId && !dto.solicitudId) {
      throw new BadRequestException('Debe especificar una oferta o solicitud');
    }
    if (dto.ofertaId) {
      const oferta = await this.prisma.ofertaVenta.findUnique({ where: { id: dto.ofertaId } });
      if (!oferta) throw new NotFoundException('Oferta no encontrada');
    }
    if (dto.solicitudId) {
      const solicitud = await this.prisma.solicitudCompra.findUnique({ where: { id: dto.solicitudId } });
      if (!solicitud) throw new NotFoundException('Solicitud no encontrada');
    }

    const neg = await this.prisma.negociacion.create({
      data: { ...dto, precioUnitario: dto.precioUnitario, costoFlete: dto.costoFlete || 0 },
      include: this.inc,
    });

    // Notificar a la contraparte
    const destinatarioId  = dto.solicitudId ? neg.compradorId  : neg.vendedorId;
    const remitenteNombre = dto.solicitudId ? neg.vendedor.name : neg.comprador.name;

    await this.prisma.notificacion.create({
      data: {
        usuarioId: destinatarioId,
        tipo: 'NUEVA_PROPUESTA',
        titulo: 'Nueva propuesta recibida 📦',
        mensaje: `${remitenteNombre} te envió una propuesta de ${neg.cantidad.toLocaleString()} galones a $${Number(neg.precioUnitario).toFixed(2)}/gal.`,
        negociacionId: neg.id,
      },
    });

    return neg;
  }

  // ════════════════════════════════════════════════
  // LISTAR TODAS (Admin)
  // ════════════════════════════════════════════════
  async findAll(filters?: { estado?: EstadoNegociacion; vendedorId?: number; compradorId?: number }) {
    return this.prisma.negociacion.findMany({
      where: {
        ...(filters?.estado      && { estado:      filters.estado }),
        ...(filters?.vendedorId  && { vendedorId:  filters.vendedorId }),
        ...(filters?.compradorId && { compradorId: filters.compradorId }),
      },
      include: this.inc,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // MIS NEGOCIACIONES
  // ════════════════════════════════════════════════
  async findMyNegociaciones(userId: number) {
    return this.prisma.negociacion.findMany({
      where: { OR: [{ vendedorId: Number(userId) }, { compradorId: Number(userId) }] },
      include: this.inc,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // UNA POR ID
  // ════════════════════════════════════════════════
  async findOne(id: string) {
    const neg = await this.prisma.negociacion.findUnique({ where: { id }, include: this.inc });
    if (!neg) throw new NotFoundException(`Negociación ${id} no encontrada`);
    return neg;
  }

  // ════════════════════════════════════════════════
  // ACTUALIZAR GENERAL
  // ════════════════════════════════════════════════
  async update(id: string, dto: UpdateNegociacionDto, userId: number) {
    const neg = await this.findOne(id);
    if (neg.vendedorId !== userId && neg.compradorId !== userId) {
      throw new ForbiddenException('No tienes permiso');
    }
    return this.prisma.negociacion.update({ where: { id }, data: dto, include: this.inc });
  }

  // ════════════════════════════════════════════════
  // ACEPTAR → crea Envío + Factura + notifica
  // ofertaId → vendedor acepta | solicitudId → comprador acepta
  // ════════════════════════════════════════════════
  async aceptar(id: string, userId: number, notasVendedor?: string) {
    const neg = await this.findOne(id);

    // Determinar quién debe aceptar según el origen
    const quienRespondeId = neg.ofertaId ? neg.vendedorId : neg.compradorId;
    if (quienRespondeId !== userId) {
      throw new ForbiddenException('No tienes permiso para aceptar esta propuesta');
    }
    if (neg.estado !== EstadoNegociacion.ESPERANDO_CONFIRMACION) {
      throw new BadRequestException('La negociación no está esperando confirmación');
    }

    // Notificar a quien envió la propuesta
    const destinatarioId = neg.ofertaId ? neg.compradorId : neg.vendedorId;

    // 1. Confirmar negociación
    const updated = await this.prisma.negociacion.update({
      where: { id },
      data: { estado: EstadoNegociacion.CONFIRMADA, notasVendedor },
      include: this.inc,
    });

    // 2. Crear Envío
    const origen = neg.oferta?.ubicacion ?? neg.solicitud?.ciudad ?? neg.ciudad;
    await this.prisma.envio.create({
      data: {
        negociacionId: id,
        origen,
        destino: neg.direccionEntrega,
        estadoEnvio: 'PENDIENTE',
        progresoEstimado: 5,
        fechaEntregaEst: neg.solicitud?.fechaRequerida ?? null,
      },
    });

    // 3. Crear Factura
    const subtotal           = Number(neg.cantidad) * Number(neg.precioUnitario);
    const costoFlete         = Number(neg.costoFlete ?? 0);
    const comisionPlataforma = subtotal * 0.02;
    const total              = subtotal + costoFlete + comisionPlataforma;

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

    // 4. Notificar a quien envió la propuesta
    await this.prisma.notificacion.create({
      data: {
        usuarioId: destinatarioId,
        tipo: 'PROPUESTA_ACEPTADA',
        titulo: '¡Tu propuesta fue aceptada! 🎉',
        mensaje: `La propuesta de ${neg.cantidad.toLocaleString()} galones de ${neg.tipoProducto} fue aceptada. Realiza el pago para continuar.`,
        negociacionId: id,
      },
    });

    return updated;
  }

  // ════════════════════════════════════════════════
  // RECHAZAR — quien debe responder rechaza
  // ofertaId → vendedor rechaza | solicitudId → comprador rechaza
  // ════════════════════════════════════════════════
  async rechazar(id: string, userId: number, motivo?: string) {
    const neg = await this.findOne(id);

    // Determinar quién debe responder según el origen
    const quienRespondeId = neg.ofertaId ? neg.vendedorId : neg.compradorId;
    if (quienRespondeId !== userId) {
      throw new ForbiddenException('No tienes permiso para rechazar esta propuesta');
    }

    // Notificar a quien envió la propuesta
    const destinatarioId  = neg.ofertaId ? neg.compradorId : neg.vendedorId;
    const remitenteNombre = neg.ofertaId ? neg.vendedor.name : neg.comprador.name;

    const updated = await this.prisma.negociacion.update({
      where: { id },
      data: {
        estado: EstadoNegociacion.RECHAZADA,
        ...(neg.ofertaId ? { notasVendedor: motivo } : { notasComprador: motivo }),
      },
      include: this.inc,
    });

    await this.prisma.notificacion.create({
      data: {
        usuarioId: destinatarioId,
        tipo: 'PROPUESTA_RECHAZADA',
        titulo: 'Propuesta rechazada ❌',
        mensaje: motivo
          ? `Tu propuesta fue rechazada. Motivo: ${motivo}`
          : `${remitenteNombre} rechazó tu propuesta de ${neg.cantidad.toLocaleString()} galones.`,
        negociacionId: id,
      },
    });

    return updated;
  }

  // ════════════════════════════════════════════════
  // CANCELAR — quien envió la propuesta la cancela
  // ofertaId → comprador cancela | solicitudId → vendedor cancela
  // ════════════════════════════════════════════════
  async cancelar(id: string, userId: number, motivo?: string) {
    const neg = await this.findOne(id);

    // Quien esperaba respuesta es quien puede cancelar
    const quienEsperaId   = neg.ofertaId ? neg.compradorId : neg.vendedorId;
    if (quienEsperaId !== userId) {
      throw new ForbiddenException('No tienes permiso para cancelar esta propuesta');
    }

    // Notificar a quien debía responder
    const destinatarioId   = neg.ofertaId ? neg.vendedorId : neg.compradorId;
    const canceladorNombre = neg.ofertaId ? neg.comprador.name : neg.vendedor.name;

    const updated = await this.prisma.negociacion.update({
      where: { id },
      data: {
        estado: EstadoNegociacion.CANCELADA,
        ...(neg.ofertaId ? { notasComprador: motivo } : { notasVendedor: motivo }),
      },
      include: this.inc,
    });

    await this.prisma.notificacion.create({
      data: {
        usuarioId: destinatarioId,
        tipo: 'PROPUESTA_RECHAZADA',
        titulo: 'Propuesta cancelada',
        mensaje: motivo
          ? `${canceladorNombre} canceló la propuesta. Motivo: ${motivo}`
          : `${canceladorNombre} canceló la propuesta de ${neg.cantidad.toLocaleString()} galones.`,
        negociacionId: id,
      },
    });

    return updated;
  }

  // ════════════════════════════════════════════════
  // COMPROBANTE DE PAGO — comprador sube URL
  // ════════════════════════════════════════════════
  async subirComprobante(id: string, comprobanteURL: string, metodoPago: string, compradorId: number) {
    const neg = await this.findOne(id);

    if (neg.compradorId !== compradorId) {
      throw new ForbiddenException('Solo el comprador puede subir el comprobante');
    }
    if (!neg.factura) {
      throw new BadRequestException('Esta negociación no tiene factura generada');
    }
    if (!['PENDIENTE', 'RECHAZADO'].includes(neg.factura.estadoPago)) {
      throw new BadRequestException('El pago ya fue procesado o está en revisión');
    }

    const factura = await this.prisma.factura.update({
      where: { negociacionId: id },
      data: { comprobanteURL, metodoPago, estadoPago: 'COMPROBANTE_SUBIDO' },
    });

    // Notificar a todos los admins
    const admins = await this.prisma.user.findMany({
      where: { role: { name: { in: ['ADMIN', 'SUPER_ADMIN'] } } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await this.prisma.notificacion.createMany({
        data: admins.map((a) => ({
          usuarioId: a.id,
          tipo: 'NUEVA_PROPUESTA',
          titulo: 'Comprobante de pago subido 📎',
          mensaje: `${neg.comprador.name} subió comprobante via ${metodoPago} por $${Number(neg.factura!.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}. Revisa y confirma.`,
          negociacionId: id,
        })),
      });
    }

    return factura;
  }

  // ════════════════════════════════════════════════
  // CONFIRMAR PAGO (Admin)
  // ════════════════════════════════════════════════
  async confirmarPago(id: string) {
    const neg = await this.findOne(id);
    if (!neg.factura) throw new BadRequestException('Sin factura');
    if (neg.factura.estadoPago !== 'COMPROBANTE_SUBIDO') {
      throw new BadRequestException('No hay comprobante pendiente de revisión');
    }

    // 1. Confirmar pago en factura
    const factura = await this.prisma.factura.update({
      where: { negociacionId: id },
      data: { estadoPago: 'CONFIRMADO' },
    });

    // 2. Avanzar envío a PAGADO
    if (neg.envio) {
      await this.prisma.envio.update({
        where: { negociacionId: id },
        data: { estadoEnvio: 'PAGADO', progresoEstimado: 25 },
      });
    }

    // 3. Notificar a ambas partes
    await this.prisma.notificacion.createMany({
      data: [
        {
          usuarioId: neg.vendedorId,
          tipo: 'PROPUESTA_ACEPTADA',
          titulo: '¡Pago confirmado — prepara el pedido! 💰',
          mensaje: `El pago de ${neg.comprador.name} fue verificado. Prepara ${neg.cantidad.toLocaleString()} galones de ${neg.tipoProducto} para despachar.`,
          negociacionId: id,
        },
        {
          usuarioId: neg.compradorId,
          tipo: 'PROPUESTA_ACEPTADA',
          titulo: '¡Pago verificado! ✅',
          mensaje: `Tu pago fue confirmado por el administrador. El vendedor comenzará a preparar tu pedido.`,
          negociacionId: id,
        },
      ],
    });

    return factura;
  }

  // ════════════════════════════════════════════════
  // RECHAZAR COMPROBANTE (Admin)
  // ════════════════════════════════════════════════
  async rechazarPago(id: string, motivo?: string) {
    const neg = await this.findOne(id);
    if (!neg.factura) throw new BadRequestException('Sin factura');

    const factura = await this.prisma.factura.update({
      where: { negociacionId: id },
      data: { estadoPago: 'RECHAZADO' },
    });

    await this.prisma.notificacion.create({
      data: {
        usuarioId: neg.compradorId,
        tipo: 'PROPUESTA_RECHAZADA',
        titulo: 'Comprobante rechazado ❌',
        mensaje: motivo
          ? `Tu comprobante fue rechazado. Motivo: ${motivo}. Sube un nuevo comprobante.`
          : `Tu comprobante de pago fue rechazado. Por favor sube un comprobante válido.`,
        negociacionId: id,
      },
    });

    return factura;
  }

  // ════════════════════════════════════════════════
  // LIBERAR FONDOS AL VENDEDOR (Admin, post-entrega)
  // ════════════════════════════════════════════════
  async liberarFondos(id: string) {
    const neg = await this.findOne(id);
    if (!neg.factura)                          throw new BadRequestException('Sin factura');
    if (neg.factura.estadoPago !== 'CONFIRMADO') throw new BadRequestException('El pago no está confirmado');
    if (neg.factura.fondosLiberados)             throw new BadRequestException('Los fondos ya fueron liberados');

    const factura = await this.prisma.factura.update({
      where: { negociacionId: id },
      data: { fondosLiberados: true, fechaLiberacion: new Date() },
    });

    // Marcar negociación como COMPLETADA
    await this.prisma.negociacion.update({
      where: { id },
      data: { estado: EstadoNegociacion.COMPLETADA },
    });

    await this.prisma.notificacion.create({
      data: {
        usuarioId: neg.vendedorId,
        tipo: 'PROPUESTA_ACEPTADA',
        titulo: '¡Fondos liberados a tu cuenta! 🏦',
        mensaje: `Se liberaron $${Number(neg.factura.total).toLocaleString('en-US', { minimumFractionDigits: 2 })} a tu cuenta. La negociación está completada.`,
        negociacionId: id,
      },
    });

    return factura;
  }

  // ════════════════════════════════════════════════
  // ELIMINAR (Admin)
  // ════════════════════════════════════════════════
  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.negociacion.delete({ where: { id } });
  }
}