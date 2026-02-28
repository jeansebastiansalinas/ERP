import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
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

  // JwtStrategy retorna: { userId: payload.sub, email, role }
  private uid(req: any): number {
    return Number(req.user.userId);
  }

  // ════════════════════════════════════════════════
  // POST /negociaciones - Crear negociación
  // ════════════════════════════════════════════════
  @Post()
  create(@Body() createNegociacionDto: CreateNegociacionDto) {
    return this.negociacionesService.create(createNegociacionDto);
  }

  // ════════════════════════════════════════════════
  // GET /negociaciones/mis
  // FIXES: era "mis-negociaciones", el front llama "mis"
  // FIXES: era this.uid(req), el JWT usa this.uid(req)
  // ════════════════════════════════════════════════
  @Get('mis')
  findMyNegociaciones(@Request() req) {
    return this.negociacionesService.findMyNegociaciones(this.uid(req));
  }

  // ════════════════════════════════════════════════
  // GET /negociaciones - Listar todas (Admin)
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
  // GET /negociaciones/:id - Ver una negociación
  // ════════════════════════════════════════════════
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.negociacionesService.findOne(id);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id - Actualizar general
  // FIXES: this.uid(req) → this.uid(req)
  // ════════════════════════════════════════════════
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNegociacionDto: UpdateNegociacionDto,
    @Request() req,
  ) {
    return this.negociacionesService.update(id, updateNegociacionDto, this.uid(req));
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/aceptar - Vendedor acepta
  // FIXES: era @Post, el front usa PATCH
  // FIXES: this.uid(req) → this.uid(req)
  // ════════════════════════════════════════════════
  @Patch(':id/aceptar')
  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  aceptar(
    @Param('id') id: string,
    @Body('notasVendedor') notasVendedor: string,
    @Request() req,
  ) {
    return this.negociacionesService.aceptar(id, this.uid(req), notasVendedor);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/rechazar - Vendedor rechaza
  // FIXES: era @Post, el front usa PATCH
  // FIXES: this.uid(req) → this.uid(req)
  // ════════════════════════════════════════════════
  @Patch(':id/rechazar')
  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  rechazar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    return this.negociacionesService.rechazar(id, this.uid(req), motivo);
  }

  // ════════════════════════════════════════════════
  // PATCH /negociaciones/:id/cancelar - Cliente cancela
  // FIXES: era @Post, el front usa PATCH
  // FIXES: this.uid(req) → this.uid(req)
  // ════════════════════════════════════════════════
  @Patch(':id/cancelar')
  @UseGuards(RolesGuard)
  @Roles(RoleName.COMPRADOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  cancelar(
    @Param('id') id: string,
    @Body('motivo') motivo: string,
    @Request() req,
  ) {
    return this.negociacionesService.cancelar(id, this.uid(req), motivo);
  }

  // ════════════════════════════════════════════════
  // DELETE /negociaciones/:id - Eliminar (Admin)
  // ════════════════════════════════════════════════
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.negociacionesService.remove(id);
  }
}