import { IsEnum, IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional, IsDateString, Min } from 'class-validator';
import { TipoProducto } from '@prisma/client';

export class CreateOfertaDto {
  @IsEnum(TipoProducto)
  @IsNotEmpty()
  tipoProducto: TipoProducto;

  @IsNumber()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsString()
  @IsNotEmpty()
  ubicacion: string;

  @IsString()
  @IsNotEmpty()
  pais: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsDateString()
  fechaDisponible: string;

  @IsDateString()
  @IsOptional()
  fechaExpiracion?: string;

  @IsString()
  @IsOptional()
  descripcion?: string;

  @IsBoolean()
  @IsOptional()
  incluyeFlete?: boolean;

  @IsNumber()
  @IsOptional()
  radioEntrega?: number;
}