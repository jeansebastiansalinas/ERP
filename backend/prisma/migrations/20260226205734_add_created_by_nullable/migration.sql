/*
  Warnings:

  - You are about to drop the `OfertaVenta` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SolicitudCompra` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OfertaVenta" DROP CONSTRAINT "OfertaVenta_vendedorId_fkey";

-- DropForeignKey
ALTER TABLE "SolicitudCompra" DROP CONSTRAINT "SolicitudCompra_compradorId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "createdById" INTEGER;

-- DropTable
DROP TABLE "OfertaVenta";

-- DropTable
DROP TABLE "SolicitudCompra";

-- DropEnum
DROP TYPE "EstadoOferta";

-- DropEnum
DROP TYPE "EstadoSolicitud";

-- DropEnum
DROP TYPE "TipoProducto";

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
