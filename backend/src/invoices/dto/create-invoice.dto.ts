import { IsNumber, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  customerName: string;

  @IsNumber()
  total: number;
}
