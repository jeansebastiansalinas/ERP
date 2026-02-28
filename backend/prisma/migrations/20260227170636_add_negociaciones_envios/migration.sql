-- CreateEnum
CREATE TYPE "EstadoNegociacion" AS ENUM ('ESPERANDO_CONFIRMACION', 'CONFIRMADA', 'RECHAZADA', 'CANCELADA', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('PENDIENTE', 'PAGADO', 'EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'COMPROBANTE_SUBIDO', 'VERIFICANDO', 'CONFIRMADO', 'RECHAZADO');

-- CreateTable
CREATE TABLE "Negociacion" (
    "id" TEXT NOT NULL,
    "vendedorId" INTEGER NOT NULL,
    "compradorId" INTEGER NOT NULL,
    "ofertaId" TEXT,
    "solicitudId" TEXT,
    "tipoProducto" "TipoProducto" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "incluyeFlete" BOOLEAN NOT NULL DEFAULT false,
    "costoFlete" DECIMAL(10,2),
    "direccionEntrega" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "estado" "EstadoNegociacion" NOT NULL DEFAULT 'ESPERANDO_CONFIRMACION',
    "notasVendedor" TEXT,
    "notasComprador" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Negociacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Envio" (
    "id" TEXT NOT NULL,
    "negociacionId" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "origenLat" DOUBLE PRECISION,
    "origenLng" DOUBLE PRECISION,
    "destino" TEXT NOT NULL,
    "destinoLat" DOUBLE PRECISION,
    "destinoLng" DOUBLE PRECISION,
    "conductorNombre" TEXT,
    "conductorTelefono" TEXT,
    "vehiculoPlaca" TEXT,
    "vehiculoTipo" TEXT,
    "estadoEnvio" "EstadoEnvio" NOT NULL DEFAULT 'PENDIENTE',
    "progresoEstimado" INTEGER,
    "fechaSalida" TIMESTAMP(3),
    "fechaEntregaEst" TIMESTAMP(3),
    "fechaEntregaReal" TIMESTAMP(3),
    "comprobanteURL" TEXT,
    "firmadoPor" TEXT,
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Envio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL,
    "negociacionId" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "costoFlete" DECIMAL(10,2) NOT NULL,
    "comisionPlataforma" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estadoPago" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" TEXT,
    "comprobanteURL" TEXT,
    "fondosLiberados" BOOLEAN NOT NULL DEFAULT false,
    "fechaLiberacion" TIMESTAMP(3),
    "archivoURL" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Factura_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calificacion" (
    "id" SERIAL NOT NULL,
    "negociacionId" TEXT NOT NULL,
    "calificadorId" INTEGER NOT NULL,
    "calificadoId" INTEGER NOT NULL,
    "estrellas" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calificacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Negociacion_vendedorId_idx" ON "Negociacion"("vendedorId");

-- CreateIndex
CREATE INDEX "Negociacion_compradorId_idx" ON "Negociacion"("compradorId");

-- CreateIndex
CREATE INDEX "Negociacion_estado_idx" ON "Negociacion"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Envio_negociacionId_key" ON "Envio"("negociacionId");

-- CreateIndex
CREATE INDEX "Envio_estadoEnvio_idx" ON "Envio"("estadoEnvio");

-- CreateIndex
CREATE UNIQUE INDEX "Factura_negociacionId_key" ON "Factura"("negociacionId");

-- CreateIndex
CREATE INDEX "Factura_estadoPago_idx" ON "Factura"("estadoPago");

-- CreateIndex
CREATE INDEX "Calificacion_calificadoId_idx" ON "Calificacion"("calificadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Calificacion_negociacionId_calificadorId_key" ON "Calificacion"("negociacionId", "calificadorId");

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
ALTER TABLE "Negociacion" ADD CONSTRAINT "Negociacion_vendedorId_fkey" FOREIGN KEY ("vendedorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negociacion" ADD CONSTRAINT "Negociacion_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negociacion" ADD CONSTRAINT "Negociacion_ofertaId_fkey" FOREIGN KEY ("ofertaId") REFERENCES "OfertaVenta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Negociacion" ADD CONSTRAINT "Negociacion_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "SolicitudCompra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Envio" ADD CONSTRAINT "Envio_negociacionId_fkey" FOREIGN KEY ("negociacionId") REFERENCES "Negociacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Factura" ADD CONSTRAINT "Factura_negociacionId_fkey" FOREIGN KEY ("negociacionId") REFERENCES "Negociacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_calificadorId_fkey" FOREIGN KEY ("calificadorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Calificacion" ADD CONSTRAINT "Calificacion_calificadoId_fkey" FOREIGN KEY ("calificadoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
