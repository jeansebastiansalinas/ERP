import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RoleName } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(dto: RegisterDto) {
    // Validar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email ya registrado');
    }

    // Validar si el rol existe
    const roleExists = await this.prisma.role.findUnique({
      where: { name: dto.role },
    });

    if (!roleExists) {
      throw new BadRequestException(`Rol inválido: ${dto.role}`);
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hashedPassword,
        name: dto.name,
        role: {
          connect: { name: dto.role }, // dto.role es del enum RoleName
        },
      },
      include: {
        role: true, // Incluye info del rol creado
      },
    });

    // Retornar usuario sin password
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
