import {
  Controller, Get, Post, Body,
  Patch, Param, Delete,
  UseGuards, Request, Query,
} from '@nestjs/common';
import { SolicitudesService } from './solicitudes.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName, TipoProducto } from '@prisma/client';

@Controller('solicitudes')
@UseGuards(JwtAuthGuard)
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  // Solo COMPRADORES pueden crear solicitudes
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.COMPRADOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  create(@Body() dto: CreateSolicitudDto, @Request() req) {
    return this.solicitudesService.create(dto, req.user.userId);
  }

  // Todos los logueados pueden ver las solicitudes activas
  @Get()
  findAll(
    @Query('tipoProducto') tipoProducto?: TipoProducto,
    @Query('ciudad') ciudad?: string,
  ) {
    return this.solicitudesService.findAll({ tipoProducto, ciudad });
  }

  // Solo el comprador ve sus propias solicitudes
  @Get('mis-solicitudes')
  @UseGuards(RolesGuard)
  @Roles(RoleName.COMPRADOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  findMisSolicitudes(@Request() req) {
    return this.solicitudesService.findMisSolicitudes(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.solicitudesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.COMPRADOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateSolicitudDto, @Request() req) {
    return this.solicitudesService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.COMPRADOR, RoleName.ADMIN, RoleName.SUPER_ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.solicitudesService.remove(id, req.user.userId);
  }
}