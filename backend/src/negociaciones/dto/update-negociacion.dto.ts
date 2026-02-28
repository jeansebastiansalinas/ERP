import { PartialType } from '@nestjs/mapped-types';
import { CreateNegociacionDto } from './create-negociacion.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoNegociacion } from '@prisma/client';

export class UpdateNegociacionDto extends PartialType(CreateNegociacionDto) {
  @IsEnum(EstadoNegociacion)
  @IsOptional()
  estado?: EstadoNegociacion;

  @IsString()
  @IsOptional()
  notasVendedor?: string;
}