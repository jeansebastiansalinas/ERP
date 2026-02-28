import { Module } from '@nestjs/common';
import { NegociacionesService } from './negociaciones.service';
import { NegociacionesController } from './negociaciones.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NegociacionesController],
  providers: [NegociacionesService],
  exports: [NegociacionesService],
})
export class NegociacionesModule {}