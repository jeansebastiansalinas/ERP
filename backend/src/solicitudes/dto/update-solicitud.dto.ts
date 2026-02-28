import { PartialType } from '@nestjs/mapped-types';
import { CreateSolicitudDto } from './create-solicitud.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoOferta } from '@prisma/client';

export class UpdateSolicitudDto extends PartialType(CreateSolicitudDto) {
  @IsEnum(EstadoOferta)
  @IsOptional()
  estado?: EstadoOferta;
}