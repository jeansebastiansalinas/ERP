import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { InvoicesModule } from './invoices/invoices.module';
import { OfertasModule } from './ofertas/ofertas.module';
import { SolicitudesModule } from './solicitudes/solicitudes.module'; 
import { NegociacionesModule } from './negociaciones/negociaciones.module'; 
import { NotificacionesModule } from './notificaciones/notificaciones.module';



@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ClientsModule,
    ProductsModule,
    OrdersModule,
    InvoicesModule,
    UsersModule,
    OfertasModule,
    NegociacionesModule,
    NotificacionesModule,
    SolicitudesModule, // ← NUEVO
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}