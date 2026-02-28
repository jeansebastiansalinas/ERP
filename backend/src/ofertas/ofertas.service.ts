import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';
import { EstadoOferta, TipoProducto } from '@prisma/client';

@Injectable()
export class OfertasService {
  constructor(private prisma: PrismaService) {}

  // ════════════════════════════════════════════════
  // CREAR OFERTA (Solo VENDEDORES)
  // ════════════════════════════════════════════════
  async create(createOfertaDto: CreateOfertaDto, vendedorId: number) {
    return this.prisma.ofertaVenta.create({
      data: {
        ...createOfertaDto,
        precioUnitario: createOfertaDto.precioUnitario,
        // 📖 Convertir strings de fecha a objetos Date que Prisma entiende
        fechaDisponible: new Date(createOfertaDto.fechaDisponible),
        fechaExpiracion: createOfertaDto.fechaExpiracion
          ? new Date(createOfertaDto.fechaExpiracion)
          : null,
        vendedorId,
      },
      include: {
        vendedor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // ════════════════════════════════════════════════
  // LISTAR TODAS LAS OFERTAS ACTIVAS
  // ════════════════════════════════════════════════
  async findAll(filters?: {
    tipoProducto?: TipoProducto;
    ciudad?: string;
    precioMaximo?: number;
  }) {
    return this.prisma.ofertaVenta.findMany({
      where: {
        estado: EstadoOferta.ACTIVA,
        ...(filters?.tipoProducto && { tipoProducto: filters.tipoProducto }),
        ...(filters?.ciudad && { ciudad: filters.ciudad }),
        ...(filters?.precioMaximo && {
          precioUnitario: {
            lte: filters.precioMaximo,
          },
        }),
      },
      include: {
        vendedor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ════════════════════════════════════════════════
  // OBTENER UNA OFERTA POR ID
  // ════════════════════════════════════════════════
  async findOne(id: string) {
    const oferta = await this.prisma.ofertaVenta.findUnique({
      where: { id },
      include: {
        vendedor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!oferta) {
      throw new NotFoundException(`Oferta con ID ${id} no encontrada`);
    }

    return oferta;
  }

  // ════════════════════════════════════════════════
  // OBTENER MIS OFERTAS (Solo del vendedor actual)
  // ════════════════════════════════════════════════
  async findMyOfertas(vendedorId: number) {
    return this.prisma.ofertaVenta.findMany({
      where: {
        vendedorId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ════════════════════════════════════════════════
  // ACTUALIZAR OFERTA (Solo el dueño)
  // ════════════════════════════════════════════════
  async update(id: string, updateOfertaDto: UpdateOfertaDto, userId: number) {
    const oferta = await this.findOne(id);

    // 📖 Verificar que el usuario sea el dueño de la oferta
    if (oferta.vendedorId !== userId) {
      throw new ForbiddenException('No puedes editar ofertas de otros vendedores');
    }

    return this.prisma.ofertaVenta.update({
      where: { id },
      data: {
        ...updateOfertaDto,
        // 📖 Convertir fechas si vienen en el update
        ...(updateOfertaDto.fechaDisponible && {
          fechaDisponible: new Date(updateOfertaDto.fechaDisponible),
        }),
        ...(updateOfertaDto.fechaExpiracion && {
          fechaExpiracion: new Date(updateOfertaDto.fechaExpiracion),
        }),
      },
      include: {
        vendedor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // ════════════════════════════════════════════════
  // ELIMINAR OFERTA (Solo el dueño)
  // ════════════════════════════════════════════════
  async remove(id: string, userId: number) {
    const oferta = await this.findOne(id);

    if (oferta.vendedorId !== userId) {
      throw new ForbiddenException('No puedes eliminar ofertas de otros vendedores');
    }

    return this.prisma.ofertaVenta.delete({
      where: { id },
    });
  }
}