import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('reportes')
@UseGuards(JwtAuthGuard)
export class ReportesController {
  constructor(private readonly reportesService: ReportesService) {}

  @Get()
  async getReportes(@Req() req: any) {
    const user = req.user;
    const userId = Number(user.userId ?? user.id);
    const rol = user.role;

    if (rol === 'ADMIN' || rol === 'SUPER_ADMIN') {
      return this.reportesService.getReportesAdmin();
    }
    if (rol === 'VENDEDOR') {
      return this.reportesService.getReportesVendedor(userId);
    }
    if (rol === 'COMPRADOR') {
      return this.reportesService.getReportesComprador(userId);
    }

    return { kpis: {}, mensaje: 'Rol no reconocido' };
  }
}