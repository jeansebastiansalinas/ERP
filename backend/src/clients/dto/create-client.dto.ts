import { IsString, IsNotEmpty } from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  taxId: string;

  @IsString()
  country: string;

  @IsString()
  city: string;
}
