import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // Buscar usuario por email (simple)
  // =========================
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // =========================
  // Buscar usuario por email + rol (LOGIN)
  // =========================
  findByEmailWithRole(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  // =========================
  // Crear usuario
  // =========================
  createUser(data: {
    email: string;
    passwordHash: string;
    name?: string;
    role: RoleName;
  }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: {
          connect: {
            name: data.role,
          },
        },
      },
      include: {
        role: true,
      },
    });
  }
}
