import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController], // 🔥 SIN ESTO /users/me NO EXISTE
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
