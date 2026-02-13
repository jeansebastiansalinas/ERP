import {
  Controller,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Get,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // 🧾 Generar factura desde orden
  @Post('from-order/:orderId')
  @Roles(RoleName.ADMIN)
  generateFromOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.invoicesService.generateFromOrder(orderId);
  }

  // 📄 Ver facturas
  @Get()
  @Roles(RoleName.ADMIN)
  findAll() {
    return this.invoicesService.findAll();
  }
}
