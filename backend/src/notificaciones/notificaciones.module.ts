import { Module } from '@nestjs/common';
import { NotificacionesController } from './notificaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificacionesController],
})
export class NotificacionesModule {}