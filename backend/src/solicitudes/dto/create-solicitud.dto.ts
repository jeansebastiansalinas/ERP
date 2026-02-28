import {
  IsEnum, IsNotEmpty, IsNumber,
  IsString, IsOptional, IsDateString, Min,
} from 'class-validator';
import { TipoProducto } from '@prisma/client';

export class CreateSolicitudDto {
  @IsEnum(TipoProducto)
  tipoProducto: TipoProducto;

  @IsNumber()
  @Min(1)
  cantidadRequerida: number;

  @IsNumber()
  @Min(0)
  precioMaximo: number;

  @IsString()
  @IsNotEmpty()
  pais: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  direccionEntrega: string;

  @IsDateString()
  fechaRequerida: string;

  @IsDateString()
  @IsOptional()
  fechaExpiracion?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;
}