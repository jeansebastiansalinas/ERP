import { PartialType } from '@nestjs/mapped-types';
import { CreateOfertaDto } from './create-oferta.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { EstadoOferta } from '@prisma/client';

export class UpdateOfertaDto extends PartialType(CreateOfertaDto) {
  @IsEnum(EstadoOferta)
  @IsOptional()
  estado?: EstadoOferta;
}