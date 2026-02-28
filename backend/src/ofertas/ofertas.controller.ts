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
import { OfertasService } from './ofertas.service';
import { CreateOfertaDto } from './dto/create-oferta.dto';
import { UpdateOfertaDto } from './dto/update-oferta.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, TipoProducto } from '@prisma/client';

@Controller('ofertas')
@UseGuards(JwtAuthGuard)
export class OfertasController {
  constructor(private readonly ofertasService: OfertasService) {}

  // ════════════════════════════════════════════════
  // POST /ofertas - Crear oferta (Solo VENDEDORES)
  // ════════════════════════════════════════════════
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  create(@Body() createOfertaDto: CreateOfertaDto, @Request() req) {
    return this.ofertasService.create(createOfertaDto, req.user.userId);
  }

  // ════════════════════════════════════════════════
  // GET /ofertas - Listar todas las ofertas activas
  // ════════════════════════════════════════════════
  @Get()
  findAll(
    @Query('tipoProducto') tipoProducto?: TipoProducto,
    @Query('ciudad') ciudad?: string,
    @Query('precioMaximo') precioMaximo?: string,
  ) {
    return this.ofertasService.findAll({
      tipoProducto,
      ciudad,
      precioMaximo: precioMaximo ? parseFloat(precioMaximo) : undefined,
    });
  }

  // ════════════════════════════════════════════════
  // GET /ofertas/mis-ofertas - Mis ofertas
  // ════════════════════════════════════════════════
  @Get('mis-ofertas')
  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  findMyOfertas(@Request() req) {
    return this.ofertasService.findMyOfertas(req.user.userId);
  }

  // ════════════════════════════════════════════════
  // GET /ofertas/:id - Ver una oferta
  // ════════════════════════════════════════════════
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ofertasService.findOne(id);
  }

  // ════════════════════════════════════════════════
  // PATCH /ofertas/:id - Actualizar oferta
  // ════════════════════════════════════════════════
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateOfertaDto: UpdateOfertaDto,
    @Request() req,
  ) {
    return this.ofertasService.update(id, updateOfertaDto, req.user.userId);
  }

  // ════════════════════════════════════════════════
  // DELETE /ofertas/:id - Eliminar oferta
  // ════════════════════════════════════════════════
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.VENDEDOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.ofertasService.remove(id, req.user.userId);
  }
}