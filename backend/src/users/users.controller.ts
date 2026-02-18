import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RoleName } from '@prisma/client';

@Controller('users')
export class UsersController {

 @UseGuards(JwtAuthGuard)  // ← ✅ Solo verificar que esté logueado
@Get('me')
getProfile(@Req() req) {
  return req.user;
}
}
