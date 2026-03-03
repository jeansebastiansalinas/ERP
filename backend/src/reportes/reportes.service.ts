import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async getReportesAdmin() {
    const [negociaciones, facturas, envios, ofertas, solicitudes, usuarios] =
      await Promise.all([
        this.prisma.negociacion.findMany({
          include: {
            factura: true,
            vendedor: { select: { id: true, name: true } },
            comprador: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.factura.findMany({ orderBy: { createdAt: 'asc' } }),
        this.prisma.envio.findMany({ orderBy: { createdAt: 'asc' } }),
        this.prisma.ofertaVenta.findMany(),
        this.prisma.solicitudCompra.findMany(),
        this.prisma.user.findMany({ include: { role: true } }),
      ]);

    const facturasConfirmadas = facturas.filter(f => f.estadoPago === 'CONFIRMADO');

    return {
      kpis: {
        totalNegociaciones: negociaciones.length,
        negociacionesCompletadas: negociaciones.filter(n => n.estado === 'COMPLETADA').length,
        totalVolumenGalones: negociaciones.filter(n => n.estado === 'COMPLETADA').reduce((a, n) => a + n.cantidad, 0),
        totalComisiones: facturasConfirmadas.reduce((a, f) => a + Number(f.comisionPlataforma), 0),
        totalFacturado: facturasConfirmadas.reduce((a, f) => a + Number(f.total), 0),
        fondosLiberados: facturas.filter(f => f.fondosLiberados).reduce((a, f) => a + Number(f.total), 0),
        totalVendedores: usuarios.filter(u => u.role.name === 'VENDEDOR').length,
        totalCompradores: usuarios.filter(u => u.role.name === 'COMPRADOR').length,
        totalOfertas: ofertas.length,
        totalSolicitudes: solicitudes.length,
        tasaExito: negociaciones.length > 0
          ? Math.round((negociaciones.filter(n => n.estado === 'COMPLETADA').length / negociaciones.length) * 100)
          : 0,
      },
      negPorEstado: this.contarPorCampo(negociaciones, 'estado'),
      ingresosPorMes: this.agruparPorMes(facturasConfirmadas, f => ({
        comision: Number(f.comisionPlataforma),
        total: Number(f.total),
      })),
      volumenPorTipo: this.contarVolumenPorTipo(negociaciones),
      enviosPorEstado: this.contarPorCampo(envios, 'estadoEnvio'),
      topVendedores: this.topUsuariosPorMonto(negociaciones.filter(n => n.factura?.estadoPago === 'CONFIRMADO'), 'vendedor'),
      topCompradores: this.topUsuariosPorMonto(negociaciones.filter(n => n.factura?.estadoPago === 'CONFIRMADO'), 'comprador'),
      pagosPorEstado: this.contarPorCampo(facturas, 'estadoPago'),
      actividadPorMes: this.agruparActividadPorMes(negociaciones),
    };
  }

  async getReportesVendedor(vendedorId: number) {
    const negociaciones = await this.prisma.negociacion.findMany({
      where: { vendedorId },
      include: { factura: true, comprador: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const negCompletadas = negociaciones.filter(n => n.estado === 'COMPLETADA');
    const facturasConfirmadas = negociaciones.filter(n => n.factura?.estadoPago === 'CONFIRMADO').map(n => n.factura!);

    return {
      kpis: {
        totalNegociaciones: negociaciones.length,
        completadas: negCompletadas.length,
        pendientes: negociaciones.filter(n => n.estado === 'ESPERANDO_CONFIRMACION').length,
        rechazadas: negociaciones.filter(n => n.estado === 'RECHAZADA').length,
        totalGalonesVendidos: negCompletadas.reduce((a, n) => a + n.cantidad, 0),
        totalIngresosNetos: facturasConfirmadas.reduce((a, f) => a + Number(f.total) - Number(f.comisionPlataforma), 0),
        totalFacturado: facturasConfirmadas.reduce((a, f) => a + Number(f.total), 0),
        tasaAceptacion: negociaciones.length > 0
          ? Math.round((negCompletadas.length / negociaciones.length) * 100) : 0,
      },
      misNegPorEstado: this.contarPorCampo(negociaciones, 'estado'),
      misIngresosPorMes: this.agruparPorMes(facturasConfirmadas, f => ({
        total: Number(f.total),
        neto: Number(f.total) - Number(f.comisionPlataforma),
      })),
      misVentasPorTipo: this.contarVolumenPorTipo(negCompletadas),
      misTopCompradores: this.topUsuariosPorMonto(negociaciones.filter(n => n.factura?.estadoPago === 'CONFIRMADO'), 'comprador'),
      miActividadPorMes: this.agruparActividadPorMes(negociaciones),
    };
  }

  async getReportesComprador(compradorId: number) {
    const negociaciones = await this.prisma.negociacion.findMany({
      where: { compradorId },
      include: { factura: true, envio: true, vendedor: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const negCompletadas = negociaciones.filter(n => n.estado === 'COMPLETADA');
    const facturasConfirmadas = negociaciones.filter(n => n.factura?.estadoPago === 'CONFIRMADO').map(n => n.factura!);

    return {
      kpis: {
        totalCompras: negociaciones.length,
        completadas: negCompletadas.length,
        enCurso: negociaciones.filter(n => n.estado === 'CONFIRMADA').length,
        canceladas: negociaciones.filter(n => n.estado === 'CANCELADA' || n.estado === 'RECHAZADA').length,
        totalGalonesComprados: negCompletadas.reduce((a, n) => a + n.cantidad, 0),
        totalGastado: facturasConfirmadas.reduce((a, f) => a + Number(f.total), 0),
        promedioGalonesPorCompra: negCompletadas.length > 0
          ? Math.round(negCompletadas.reduce((a, n) => a + n.cantidad, 0) / negCompletadas.length) : 0,
        tasaCompletado: negociaciones.length > 0
          ? Math.round((negCompletadas.length / negociaciones.length) * 100) : 0,
      },
      misComprasPorEstado: this.contarPorCampo(negociaciones, 'estado'),
      miGastoPorMes: this.agruparPorMes(facturasConfirmadas, f => ({ total: Number(f.total) })),
      misComprasPorTipo: this.contarVolumenPorTipo(negCompletadas),
      misEnviosPorEstado: this.contarPorCampo(negociaciones.filter(n => n.envio).map(n => n.envio!), 'estadoEnvio'),
      misTopVendedores: this.topUsuariosPorMonto(negociaciones.filter(n => n.factura?.estadoPago === 'CONFIRMADO'), 'vendedor'),
      miActividadPorMes: this.agruparActividadPorMes(negociaciones),
    };
  }

  // ── Helpers ───────────────────────────────────────────────────
  private contarPorCampo<T>(arr: T[], campo: keyof T): { name: string; value: number }[] {
    const map = new Map<string, number>();
    for (const item of arr) {
      const key = String(item[campo]);
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }

  private contarVolumenPorTipo(negs: any[]): { tipo: string; galones: number; monto: number }[] {
    const map = new Map<string, { galones: number; monto: number }>();
    for (const n of negs) {
      const prev = map.get(n.tipoProducto) ?? { galones: 0, monto: 0 };
      map.set(n.tipoProducto, {
        galones: prev.galones + n.cantidad,
        monto: prev.monto + n.cantidad * Number(n.precioUnitario),
      });
    }
    return Array.from(map.entries()).map(([tipo, v]) => ({ tipo, ...v }));
  }

  private agruparPorMes<T>(arr: T[], extractor: (item: T) => Record<string, number>): any[] {
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const map = new Map<string, Record<string, number>>();
    for (const item of arr) {
      const d = new Date((item as any).createdAt);
      const key = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
      const prev = map.get(key) ?? {};
      const vals = extractor(item);
      const merged: Record<string, number> = { ...prev };
      for (const [k, v] of Object.entries(vals)) merged[k] = (merged[k] ?? 0) + v;
      map.set(key, merged);
    }
    return Array.from(map.entries()).map(([mes, vals]) => ({ mes, ...vals }));
  }

  private agruparActividadPorMes(negs: any[]) {
    const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const map = new Map<string, { total: number; confirmadas: number; completadas: number }>();
    for (const n of negs) {
      const d = new Date(n.createdAt);
      const key = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
      const prev = map.get(key) ?? { total: 0, confirmadas: 0, completadas: 0 };
      map.set(key, {
        total: prev.total + 1,
        confirmadas: prev.confirmadas + (n.estado === 'CONFIRMADA' ? 1 : 0),
        completadas: prev.completadas + (n.estado === 'COMPLETADA' ? 1 : 0),
      });
    }
    return Array.from(map.entries()).map(([mes, v]) => ({ mes, ...v }));
  }

  private topUsuariosPorMonto(negs: any[], campo: 'vendedor' | 'comprador', top = 5) {
    const map = new Map<string, { monto: number; cantidad: number }>();
    for (const n of negs) {
      const nombre = n[campo]?.name ?? 'Desconocido';
      const prev = map.get(nombre) ?? { monto: 0, cantidad: 0 };
      map.set(nombre, {
        monto: prev.monto + (n.factura ? Number(n.factura.total) : n.cantidad * Number(n.precioUnitario)),
        cantidad: prev.cantidad + n.cantidad,
      });
    }
    return Array.from(map.entries())
      .map(([nombre, v]) => ({ nombre, ...v }))
      .sort((a, b) => b.monto - a.monto)
      .slice(0, top);
  }
}