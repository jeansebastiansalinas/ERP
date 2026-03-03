import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Request,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@prisma/client';

class AdminCreateUserDto {
  email: string;
  password: string;
  name?: string;
  role: RoleName;
}

class AdminUpdateUserDto {
  name?: string;
  email?: string;
  role?: RoleName;
  isActive?: boolean;
  password?: string;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ════════════════════════════════════════════════
  // GET /users/me — perfil propio
  // Retorna { id, email, name, role } normalizado
  // ════════════════════════════════════════════════
  @Get('me')
  async getProfile(@Request() req) {
    // req.user viene del JwtStrategy: { userId, email, role }
    // Obtenemos el user real de la DB para tener id correcto y role como string
    const user = await this.usersService.getMe(req.user.userId);
    return user;
  }

  // ════════════════════════════════════════════════
  // GET /users/stats
  // ════════════════════════════════════════════════
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  getStats() {
    return this.usersService.getStats();
  }

  // ════════════════════════════════════════════════
  // GET /users — listar todos (Admin)
  // ════════════════════════════════════════════════
  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  findAll(
    @Query('role') role?: RoleName,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.findAll({
      role,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
  }

  // ════════════════════════════════════════════════
  // GET /users/:id — detalle (Admin)
  // ════════════════════════════════════════════════
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  // ════════════════════════════════════════════════
  // POST /users — crear usuario (Admin)
  // ════════════════════════════════════════════════
  @Post()
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  create(@Body() dto: AdminCreateUserDto) {
    return this.usersService.adminCreateUser(dto);
  }

  // ════════════════════════════════════════════════
  // PATCH /users/:id — editar usuario (Admin)
  // ════════════════════════════════════════════════
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(id, dto);
  }

  // ════════════════════════════════════════════════
  // DELETE /users/:id — eliminar usuario (Admin)
  // ════════════════════════════════════════════════
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.usersService.adminDeleteUser(id, req.user.userId);
  }
}