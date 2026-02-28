import { IsEnum, IsNotEmpty, IsNumber, IsString, IsBoolean, IsOptional, Min } from 'class-validator';
import { TipoProducto } from '@prisma/client';

export class CreateNegociacionDto {
  @IsNumber()
  @IsNotEmpty()
  vendedorId: number;

  @IsNumber()
  @IsNotEmpty()
  compradorId: number;

  @IsString()
  @IsOptional()
  ofertaId?: string;

  @IsString()
  @IsOptional()
  solicitudId?: string;

  @IsEnum(TipoProducto)
  @IsNotEmpty()
  tipoProducto: TipoProducto;

  @IsNumber()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precioUnitario: number;

  @IsBoolean()
  @IsOptional()
  incluyeFlete?: boolean;

  @IsNumber()
  @IsOptional()
  costoFlete?: number;

  @IsString()
  @IsNotEmpty()
  direccionEntrega: string;

  @IsString()
  @IsNotEmpty()
  ciudad: string;

  @IsString()
  @IsNotEmpty()
  pais: string;

  @IsString()
  @IsOptional()
  notasComprador?: string;
}