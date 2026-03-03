import {
  Controller, Get, Post, Body, Patch,
  Param, Delete, UseGuards, Request, Query,
} from '@nestjs/common';
import { NegociacionesService } from './negociaciones.service';
import { CreateNegociacionDto } from './dto/create-negociacion.dto';
import { UpdateNegociacionDto } from './dto/update-negociacion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, EstadoNegociacion } from '@prisma/client';

@Controller('negociaciones')
@UseGuards(JwtAuthGuard)
export class NegociacionesController {
  constructor(private readonly negociacionesService: NegociacionesService) {}

  private uid(req: any): number { return Number(req.user.userId); }

  // ════════════════════════════════════════════════
  // POST /negociaciones — Crear negociación
  // ════════════════════════════════════════════════
  @Post()
  create(@Body() dto: CreateNegociacionDto) {
    return this.negociacionesService.create(dto);
  }

  // ════════════════════════════════════════════════
  // GET /negociaciones/mis — Mis negociaciones
  // ════════════════════════════════════════════════
  @Get('mis')
  findMis(@Request() req) {
    return this.negociacionesService.findMyNegociaciones(this.uid(req));
  }

  // ════════════════════════════════════════════════
  // GET /negociaciones — Todas (Admin)
  // ════════════════════════════════════════════════
  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  findAll(
    @Query('estado') estado?: EstadoNegociacion,
    @Query('vendedorId') vendedorId?: string,
    @Query('compradorId') compradorId?: string,
  ) {
    return this.negociacionesService.findAll({
      estado,
      vendedorId: vendedorId ? parseInt(vendedorId) : undefined,
      compradorId: compradorId ? parseInt(compradorId) : undefined,
    });
  }

  // ════════════════════════════════════════════════
  // GET /negociaciones/:id — Ver una
  // ════════════════════════════════════════════════
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.negociacionesService.findOne(id);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id — Actualizar general
  // ════════════════════════════════════════════════
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateNegociacionDto,
    @Request() req,
  ) {
    return this.negociacionesService.update(id, dto, this.uid(req));
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/aceptar
  // ════════════════════════════════════════════════
  @Patch(':id/aceptar')
  aceptar(
    @Param('id') id: string,
    @Body('notasVendedor') notasVendedor: string,
    @Request() req,
  ) {
    return this.negociacionesService.aceptar(id, this.uid(req), notasVendedor);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/rechazar
  // ════════════════════════════════════════════════
  @Patch(':id/rechazar')
  rechazar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    return this.negociacionesService.rechazar(id, this.uid(req), motivo);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/cancelar
  // ════════════════════════════════════════════════
  @Patch(':id/cancelar')
  cancelar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    return this.negociacionesService.cancelar(id, this.uid(req), motivo);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/comprobante
  // Comprador sube URL del comprobante de pago
  // ════════════════════════════════════════════════
  @Patch(':id/comprobante')
  @UseGuards(RolesGuard)
  @Roles(RoleName.COMPRADOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  subirComprobante(
    @Param('id') id: string,
    @Body('comprobanteURL') comprobanteURL: string,
    @Body('metodoPago') metodoPago: string,
    @Request() req,
  ) {
    return this.negociacionesService.subirComprobante(id, comprobanteURL, metodoPago, this.uid(req));
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/confirmar-pago — Admin confirma
  // ════════════════════════════════════════════════
  @Patch(':id/confirmar-pago')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  confirmarPago(@Param('id') id: string) {
    return this.negociacionesService.confirmarPago(id);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/rechazar-pago — Admin rechaza comprobante
  // ════════════════════════════════════════════════
  @Patch(':id/rechazar-pago')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  rechazarPago(
    @Param('id') id: string,
    @Body('motivo') motivo?: string,
  ) {
    return this.negociacionesService.rechazarPago(id, motivo);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/liberar-fondos — Admin libera fondos
  // ════════════════════════════════════════════════
  @Patch(':id/liberar-fondos')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  liberarFondos(@Param('id') id: string) {
    return this.negociacionesService.liberarFondos(id);
  }

  // ════════════════════════════════════════════════
  // DELETE /negociaciones/:id — Eliminar (Admin)
  // ════════════════════════════════════════════════
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.negociacionesService.remove(id);
  }
}