/*
  Warnings:

  - You are about to drop the column `createdById` on the `Order` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('DIESEL', 'GASOLINA_REGULAR', 'GASOLINA_PREMIUM', 'GAS_LP');

-- CreateEnum
CREATE TYPE "EstadoOferta" AS ENUM ('ACTIVA', 'PAUSADA', 'AGOTADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('ACTIVA', 'EN_NEGOCIACION', 'CERRADA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_createdById_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "createdById";

-- CreateTable
CREATE TABLE "OfertaVenta" (
    "id" TEXT NOT NULL,
    "vendedorId" INTEGER NOT NULL,
    "tipoProducto" "TipoProducto" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "fechaDisponible" TIMESTAMP(3) NOT NULL,
    "fechaExpiracion" TIMESTAMP(3),
    "estado" "EstadoOferta" NOT NULL DEFAULT 'ACTIVA',
    "descripcion" TEXT,
    "incluyeFlete" BOOLEAN NOT NULL DEFAULT false,
    "radioEntrega" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudCompra" (
    "id" TEXT NOT NULL,
    "compradorId" INTEGER NOT NULL,
    "tipoProducto" "TipoProducto" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioMaximo" DECIMAL(10,2) NOT NULL,
    "ubicacionEntrega" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "fechaRequerida" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'ACTIVA',
    "descripcion" TEXT,
    "necesitaFlete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudCompra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfertaVenta_vendedorId_idx" ON "OfertaVenta"("vendedorId");

-- CreateIndex
CREATE INDEX "OfertaVenta_tipoProducto_idx" ON "OfertaVenta"("tipoProducto");

-- CreateIndex
CREATE INDEX "OfertaVenta_estado_idx" ON "OfertaVenta"("estado");

-- CreateIndex
CREATE INDEX "SolicitudCompra_compradorId_idx" ON "SolicitudCompra"("compradorId");

-- CreateIndex
CREATE INDEX "SolicitudCompra_tipoProducto_idx" ON "SolicitudCompra"("tipoProducto");

-- CreateIndex
CREATE INDEX "SolicitudCompra_estado_idx" ON "SolicitudCompra"("estado");

-- AddForeignKey
ALTER TABLE "OfertaVenta" ADD CONSTRAINT "OfertaVenta_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudCompra" ADD CONSTRAINT "SolicitudCompra_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
