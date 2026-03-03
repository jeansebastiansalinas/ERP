import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ════════════════════════════════════════════════
  // Métodos existentes (NO MODIFICAR)
  // ════════════════════════════════════════════════

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByEmailWithRole(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  createUser(data: {
    email: string;
    passwordHash: string;
    name?: string;
    role: RoleName;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: { connect: { name: data.role } },
      },
      include: { role: true },
    });
  }

  // ════════════════════════════════════════════════
  // ADMIN — Listar todos los usuarios
  // ════════════════════════════════════════════════
  async findAll(filters?: { role?: RoleName; isActive?: boolean }) {
    return this.prisma.user.findMany({
      where: {
        ...(filters?.role && { role: { name: filters.role } }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { name: true } },
        _count: {
          select: {
            ofertasVenta:      true,
            solicitudesCompra: true,
            negociacionesVendedor:  true,
            negociacionesComprador: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ════════════════════════════════════════════════
  // ADMIN — Obtener un usuario por ID
  // ════════════════════════════════════════════════
  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { name: true } },
        ofertasVenta: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, tipoProducto: true, cantidad: true,
            precioUnitario: true, ciudad: true, pais: true,
            estado: true, createdAt: true,
          },
        },
        solicitudesCompra: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true, tipoProducto: true, cantidadRequerida: true,
            precioMaximo: true, ciudad: true, pais: true,
            estado: true, createdAt: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    return user;
  }

  // ════════════════════════════════════════════════
  // ADMIN — Crear usuario manualmente
  // ════════════════════════════════════════════════
  async adminCreateUser(data: {
    email: string;
    password: string;
    name?: string;
    role: RoleName;
  }) {
    const exists = await this.findByEmail(data.email);
    if (exists) throw new BadRequestException('El email ya está registrado');

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await this.createUser({
      email: data.email,
      passwordHash,
      name: data.name,
      role: data.role,
    });
    const { passwordHash: _, ...safe } = user as any;
    return safe;
  }

  // ════════════════════════════════════════════════
  // ADMIN — Editar usuario
  // ════════════════════════════════════════════════
  async adminUpdateUser(
    id: number,
    data: { name?: string; email?: string; role?: RoleName; isActive?: boolean; password?: string },
  ) {
    await this.findById(id); // lanza 404 si no existe

    const updateData: any = {};
    if (data.name     !== undefined) updateData.name     = data.name;
    if (data.email    !== undefined) updateData.email    = data.email;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password)               updateData.passwordHash = await bcrypt.hash(data.password, 10);
    if (data.role)                   updateData.role = { connect: { name: data.role } };

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, name: true,
        isActive: true, createdAt: true, updatedAt: true,
        role: { select: { name: true } },
      },
    });
    return updated;
  }




  
  // ════
  // ════════════════════════════════════════════
  // ADMIN — Eliminar usuario
  // ════════════════════════════════════════════════
  async adminDeleteUser(id: number, adminId: number) {
    if (id === adminId) throw new BadRequestException('No puedes eliminar tu propia cuenta');
    await this.findById(id);
    return this.prisma.user.delete({ where: { id } });
  }



async getMe(userId: number): Promise<{ id: number; email: string; name: string | null; role: string }> {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: { select: { name: true } },
    },
  });

  if (!user) throw new NotFoundException('Usuario no encontrado');

  return {
    id:    user.id,
    email: user.email,
    name:  user.name ?? null,
    role:  user.role.name,   // ← string 'COMPRADOR', no objeto { name: 'COMPRADOR' }
  };
}
  
  // ════════════════════════════════════════════════
  // ADMIN — Stats generales del sistema
  // ════════════════════════════════════════════════
  async getStats() {
    const [
      totalUsuarios, totalVendedores, totalCompradores,
      totalOfertas, ofertasActivas,
      totalSolicitudes, solicitudesActivas,
      totalNegociaciones, negConfirmadas,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: { name: RoleName.VENDEDOR } } }),
      this.prisma.user.count({ where: { role: { name: RoleName.COMPRADOR } } }),
      this.prisma.ofertaVenta.count(),
      this.prisma.ofertaVenta.count({ where: { estado: 'ACTIVA' } }),
      this.prisma.solicitudCompra.count(),
      this.prisma.solicitudCompra.count({ where: { estado: 'ACTIVA' } }),
      this.prisma.negociacion.count(),
      this.prisma.negociacion.count({ where: { estado: 'CONFIRMADA' } }),
    ]);

    return {
      usuarios:      { total: totalUsuarios, vendedores: totalVendedores, compradores: totalCompradores },
      ofertas:       { total: totalOfertas,  activas: ofertasActivas },
      solicitudes:   { total: totalSolicitudes, activas: solicitudesActivas },
      negociaciones: { total: totalNegociaciones, confirmadas: negConfirmadas },
    };
  }
}

