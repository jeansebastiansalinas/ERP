-- CreateTable
CREATE TABLE "SolicitudCompra" (
    "id" TEXT NOT NULL,
    "tipoProducto" "TipoProducto" NOT NULL,
    "cantidadRequerida" DOUBLE PRECISION NOT NULL,
    "precioMaximo" DECIMAL(65,30) NOT NULL,
    "pais" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "direccionEntrega" TEXT NOT NULL,
    "fechaRequerida" TIMESTAMP(3) NOT NULL,
    "fechaExpiracion" TIMESTAMP(3),
    "descripcion" TEXT,
    "estado" "EstadoOferta" NOT NULL DEFAULT 'ACTIVA',
    "compradorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitudCompra_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SolicitudCompra" ADD CONSTRAINT "SolicitudCompra_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
