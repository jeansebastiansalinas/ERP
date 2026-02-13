import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RoleName } from '@prisma/client';

@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ADMIN crea clientes
  @Post()
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  // ADMIN y VENDEDOR ven clientes
  @Get()
  @Roles(RoleName.ADMIN, RoleName.VENDEDOR, RoleName.SUPER_ADMIN)
  findAll() {
    return this.clientsService.findAll();
  }
}
