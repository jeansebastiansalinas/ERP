import {
  Controller, Get, Patch, Param,
  Body, UseGuards, Request, UploadedFile,
  UseInterceptors, Post,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { EnviosService } from './envios.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, EstadoEnvio } from '@prisma/client';

@Controller('envios')
@UseGuards(JwtAuthGuard)
export class EnviosController {
  constructor(private readonly enviosService: EnviosService) {}

  private uid(req: any): number { return Number(req.user.userId); }

  // ════════════════════════════════════════════════
  // GET /envios/mis — envíos del usuario autenticado
  // ════════════════════════════════════════════════
  @Get('mis')
  getMisEnvios(@Request() req) {
    return this.enviosService.findMisEnvios(this.uid(req));
  }

  // ════════════════════════════════════════════════
  // GET /envios — todos (ADMIN)
  // ════════════════════════════════════════════════
  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  findAll() {
    return this.enviosService.findAll();
  }

  // ════════════════════════════════════════════════
  // GET /envios/:id
  // ════════════════════════════════════════════════
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.enviosService.findOne(id);
  }

  // ════════════════════════════════════════════════
  // PATCH /envios/:id/estado — ADMIN cambia estado del envío
  // ════════════════════════════════════════════════
  @Patch(':id/estado')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  cambiarEstado(
    @Param('id') id: string,
    @Body('estadoEnvio') estadoEnvio: EstadoEnvio,
    @Body('conductorNombre') conductorNombre?: string,
    @Body('conductorTelefono') conductorTelefono?: string,
    @Body('vehiculoPlaca') vehiculoPlaca?: string,
    @Body('progresoEstimado') progresoEstimado?: number,
    @Body('observaciones') observaciones?: string,
  ) {
    return this.enviosService.cambiarEstado(id, {
      estadoEnvio, conductorNombre, conductorTelefono,
      vehiculoPlaca, progresoEstimado, observaciones,
    });
  }
}