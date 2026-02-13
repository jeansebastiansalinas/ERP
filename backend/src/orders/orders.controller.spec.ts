import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 🟢 Crear orden (ADMIN y VENDEDOR)
  @Post()
  @Roles(RoleName.ADMIN, RoleName.VENDEDOR)
  create(@Body() dto: CreateOrderDto, @Req() req) {
    return this.ordersService.create(dto, req.user.userId);
  }

  // 🔵 Ver todas las órdenes (ADMIN)
  @Get()
  @Roles(RoleName.ADMIN)
  findAll() {
    return this.ordersService.findAll();
  }
}
