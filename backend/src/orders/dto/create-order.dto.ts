import { IsInt, IsPositive } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  clientId: number;

  @IsInt()
  productId: number;

  @IsPositive()
  quantity: number;
}
