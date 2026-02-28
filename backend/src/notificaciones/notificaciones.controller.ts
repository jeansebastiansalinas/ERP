
import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notificaciones')
@UseGuards(JwtAuthGuard)
export class NotificacionesController {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: extrae el userId del JWT independientemente del campo
  // que use tu JwtStrategy (sub, id, o userId)
  private extractUserId(req: any): number | null {
    const u = req.user;
    if (!u) return null;
    const raw = u.sub ?? u.id ?? u.userId ?? null;
    const id = raw !== null && raw !== undefined ? Number(raw) : null;
    return id && !isNaN(id) ? id : null;
  }

  // ────────────────────────────────────────────────
  // GET /notificaciones/mis
  // ────────────────────────────────────────────────
  @Get('mis')
  async getMisNotificaciones(@Request() req) {
    const userId = this.extractUserId(req);
    if (!userId) return [];

    return this.prisma.notificacion.findMany({
      where: { usuarioId: userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }

  // ────────────────────────────────────────────────
  // GET /notificaciones/no-leidas-count
  // ────────────────────────────────────────────────
  @Get('no-leidas-count')
  async getNoLeidasCount(@Request() req) {
    const userId = this.extractUserId(req);
    if (!userId) return { count: 0 };

    const count = await this.prisma.notificacion.count({
      where: { usuarioId: userId, leida: false },
    });
    return { count };
  }

  // ────────────────────────────────────────────────
  // PATCH /notificaciones/leer-todas
  // IMPORTANTE: debe ir ANTES de :id/leer para que
  // NestJS no confunda "leer-todas" con un :id param
  // ────────────────────────────────────────────────
  @Patch('leer-todas')
  async marcarTodasLeidas(@Request() req) {
    const userId = this.extractUserId(req);
    if (!userId) return { actualizadas: 0 };

    const result = await this.prisma.notificacion.updateMany({
      where: { usuarioId: userId, leida: false },
      data: { leida: true },
    });
    return { actualizadas: result.count };
  }

  // ────────────────────────────────────────────────
  // PATCH /notificaciones/:id/leer
  // ────────────────────────────────────────────────
  @Patch(':id/leer')
  async marcarLeida(@Param('id') id: string, @Request() req) {
    const userId = this.extractUserId(req);
    if (!userId) return null;

    return this.prisma.notificacion.update({
      where: { id, usuarioId: userId },
      data: { leida: true },
    });
  }
}