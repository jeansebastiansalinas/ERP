import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // SOLO ADMIN / SUPER_ADMIN
  @Post()
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // TODOS LOS USUARIOS AUTENTICADOS
  @Get()
  findAll() {
    return this.productsService.findAll();
  }
}
