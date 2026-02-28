-- CreateEnum
CREATE TYPE "TipoProducto" AS ENUM ('DIESEL', 'GASOLINA_CORRIENTE', 'GASOLINA_EXTRA', 'JET_FUEL', 'GLP');

-- CreateEnum
CREATE TYPE "EstadoOferta" AS ENUM ('ACTIVA', 'PAUSADA', 'VENDIDA', 'EXPIRADA');

-- CreateTable
CREATE TABLE "OfertaVenta" (
    "id" TEXT NOT NULL,
    "tipoProducto" "TipoProducto" NOT NULL,
    "cantidad" DOUBLE PRECISION NOT NULL,
    "precioUnitario" DECIMAL(65,30) NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "fechaDisponible" TIMESTAMP(3) NOT NULL,
    "fechaExpiracion" TIMESTAMP(3),
    "descripcion" TEXT,
    "incluyeFlete" BOOLEAN NOT NULL DEFAULT false,
    "radioEntrega" DOUBLE PRECISION,
    "estado" "EstadoOferta" NOT NULL DEFAULT 'ACTIVA',
    "vendedorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfertaVenta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OfertaVenta" ADD CONSTRAINT "OfertaVenta_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
