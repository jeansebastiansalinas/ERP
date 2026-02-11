import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = [
    {
      name: RoleName.SUPER_ADMIN,
      description: 'Acceso total al sistema',
    },
    {
      name: RoleName.ADMIN,
      description: 'Administrador del sistema',
    },
    {
      name: RoleName.VENDEDOR,
      description: 'Usuario encargado de ventas',
    },
    {
      name: RoleName.COMPRADOR,
      description: 'Usuario encargado de compras',
    },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
      },
    });
  }

  console.log('✅ Roles base creados correctamente');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
