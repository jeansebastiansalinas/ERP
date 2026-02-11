import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors();

  // Esta línea es clave:
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // elimina propiedades que no están en el DTO
    forbidNonWhitelisted: true, // lanza error si hay propiedades extra
    transform: true, // transforma JSON en instancias de DTO
  }));

  await app.listen(3000);
}
bootstrap();
