"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const roles = [
        {
            name: client_1.RoleName.SUPER_ADMIN,
            description: 'Acceso total al sistema',
        },
        {
            name: client_1.RoleName.ADMIN,
            description: 'Administrador del sistema',
        },
        {
            name: client_1.RoleName.VENDEDOR,
            description: 'Usuario encargado de ventas',
        },
        {
            name: client_1.RoleName.COMPRADOR,
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
//# sourceMappingURL=seed.js.map