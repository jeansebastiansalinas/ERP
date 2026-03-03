'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import Preloader from '@/components/onboarding/Preloader';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import {
  TrendingUp, DollarSign, Activity, Package, Truck, Users,
  Fuel, CheckCircle, Clock, AlertCircle, ArrowRight,
  Loader2, RefreshCw, ShoppingCart, BarChart3, Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { getAdminStats } from '@/services/admin.service';
import { getMisNegociaciones, getAllNegociaciones } from '@/services/negociaciones.service';
import { getReportes } from '@/services/reportes.service';
import { useRouter } from 'next/navigation';

// ── Colores consistentes con el resto del sistema ─────────────────────────────
const COLORS_DONA = ['#22c55e','#3b82f6','#f97316','#ef4444','#8b5cf6'];
const TOOLTIP_STYLE = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  fontSize: '12px',
};

const ESTADO_LABELS: Record<string, string> = {
  ESPERANDO_CONFIRMACION: 'Esperando',
  CONFIRMADA: 'Confirmada',
  RECHAZADA: 'Rechazada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  EN_PREPARACION: 'Preparando',
  EN_TRANSITO: 'En tránsito',
  ENTREGADO: 'Entregado',
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color, prefix = '', suffix = '', onClick }: {
  title: string; value: number | string; sub?: string; icon: any;
  color: string; prefix?: string; suffix?: string; onClick?: () => void;
}) {
  return (
    <Card
      className={`border-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1 truncate">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {prefix}{typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : value}{suffix}
            </p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ml-3 flex-shrink-0 ${color.split(' ')[0]}`}>
            <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Acceso rápido ─────────────────────────────────────────────────────────────
function AccesoRapido({ label, icon: Icon, color, href }: {
  label: string; icon: any; color: string; href: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-red-300 hover:bg-red-50 transition-all group`}
    >
      <div className={`p-3 rounded-xl ${color.split(' ')[0]} group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${color.split(' ')[1]}`} />
      </div>
      <span className="text-xs font-semibold text-gray-700">{label}</span>
    </button>
  );
}

// ── Negociación reciente ───────────────────────────────────────────────────────
function NegociacionReciente({ neg, userId }: { neg: any; userId: number }) {
  const total = neg.cantidad * Number(neg.precioUnitario);
  const esVendedor = Number(neg.vendedorId) === userId;
  const contraparte = esVendedor ? neg.comprador?.name : neg.vendedor?.name;
  const estadoConfig: Record<string, { color: string; bg: string }> = {
    ESPERANDO_CONFIRMACION: { color: 'text-yellow-700', bg: 'bg-yellow-100' },
    CONFIRMADA:   { color: 'text-blue-700',   bg: 'bg-blue-100'   },
    COMPLETADA:   { color: 'text-green-700',  bg: 'bg-green-100'  },
    RECHAZADA:    { color: 'text-red-700',    bg: 'bg-red-100'    },
    CANCELADA:    { color: 'text-gray-600',   bg: 'bg-gray-100'   },
  };
  const cfg = estadoConfig[neg.estado] ?? { color: 'text-gray-600', bg: 'bg-gray-100' };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <Fuel className="w-4 h-4 text-red-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{neg.cantidad.toLocaleString()} gal · {neg.tipoProducto}</p>
          <p className="text-xs text-gray-400">{contraparte} · {neg.ciudad}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-3">
        <p className="text-sm font-bold text-gray-900">${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.bg} ${cfg.color}`}>
          {ESTADO_LABELS[neg.estado] ?? neg.estado}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTAS POR ROL
// ══════════════════════════════════════════════════════════════════════════════

// ── Dashboard ADMIN ───────────────────────────────────────────────────────────
function DashboardAdmin({ stats, reportes }: { stats: any; reportes: any }) {
  const router = useRouter();

  const kpis = reportes?.kpis ?? {};
  const actividadPorMes = reportes?.actividadPorMes ?? [];
  const negPorEstado = (reportes?.negPorEstado ?? []).map((d: any) => ({
    ...d, name: ESTADO_LABELS[d.name] ?? d.name,
  }));
  const topVendedores = reportes?.topVendedores ?? [];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Negociaciones" value={kpis.totalNegociaciones ?? stats?.negociaciones?.total ?? 0}      icon={Activity}    color="bg-purple-50 text-purple-600" />
        <KpiCard title="Total Facturado"     value={kpis.totalFacturado ?? 0}      prefix="$" icon={DollarSign}  color="bg-green-50 text-green-600"  />
        <KpiCard title="Comisiones Ganadas"  value={kpis.totalComisiones ?? 0}     prefix="$" icon={TrendingUp}  color="bg-red-50 text-red-600"      />
        <KpiCard title="Tasa de Éxito"       value={kpis.tasaExito ?? 0}           suffix="%" icon={CheckCircle} color="bg-blue-50 text-blue-600"    />
        <KpiCard title="Usuarios Vendedores" value={kpis.totalVendedores ?? stats?.usuarios?.vendedores ?? 0}  icon={Users}      color="bg-blue-50 text-blue-600"    onClick={() => router.push('/dashboard/configuracion')} />
        <KpiCard title="Usuarios Compradores"value={kpis.totalCompradores ?? stats?.usuarios?.compradores ?? 0} icon={ShoppingCart} color="bg-orange-50 text-orange-600" onClick={() => router.push('/dashboard/configuracion')} />
        <KpiCard title="Ofertas Publicadas"  value={kpis.totalOfertas ?? stats?.ofertas?.total ?? 0}            icon={Package}    color="bg-yellow-50 text-yellow-600" onClick={() => router.push('/dashboard/vendedores')} />
        <KpiCard title="Solicitudes Activas" value={kpis.totalSolicitudes ?? stats?.solicitudes?.total ?? 0}    icon={Truck}      color="bg-green-50 text-green-600"  onClick={() => router.push('/dashboard/clientes')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Actividad mensual */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />Actividad mensual del sistema
            </CardTitle>
            <CardDescription className="text-xs">Negociaciones creadas, confirmadas y completadas</CardDescription>
          </CardHeader>
          <CardContent>
            {actividadPorMes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-gray-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Sin datos aún — crea negociaciones para ver estadísticas</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={actividadPorMes}>
                  <defs>
                    <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="total"       stroke="#ef4444" fill="url(#gTotal)" strokeWidth={2} name="Total" />
                  <Area type="monotone" dataKey="confirmadas" stroke="#3b82f6" fill="transparent" strokeWidth={2} name="Confirmadas" />
                  <Area type="monotone" dataKey="completadas" stroke="#22c55e" fill="transparent" strokeWidth={2} name="Completadas" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Dona: estados */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Estado de negociaciones</CardTitle>
            <CardDescription className="text-xs">Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            {negPorEstado.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-gray-400 text-sm">Sin datos aún</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={negPorEstado} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      paddingAngle={3} dataKey="value">
                      {negPorEstado.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS_DONA[i % COLORS_DONA.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {negPorEstado.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS_DONA[i % COLORS_DONA.length] }} />
                        <span className="text-gray-600">{d.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top vendedores */}
      {topVendedores.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-500" />Top vendedores del sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topVendedores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="nombre" stroke="#94a3b8" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Monto']} />
                <Bar dataKey="monto" fill="#ef4444" radius={[0,6,6,0]} name="Monto vendido" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Accesos rápidos admin */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />Accesos rápidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Ver Envíos',      icon: Truck,        href: '/dashboard/envios',         color: 'bg-blue-900/50 text-blue-300'   },
              { label: 'Vendedores',      icon: Package,      href: '/dashboard/vendedores',     color: 'bg-yellow-900/50 text-yellow-300'},
              { label: 'Clientes',        icon: ShoppingCart, href: '/dashboard/clientes',       color: 'bg-green-900/50 text-green-300'  },
              { label: 'Configuración',   icon: Users,        href: '/dashboard/configuracion',  color: 'bg-purple-900/50 text-purple-300'},
            ].map(a => (
              <button key={a.label} onClick={() => router.push(a.href)}
                className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 transition-all group">
                <div className={`p-2.5 rounded-xl ${a.color} group-hover:scale-110 transition-transform`}>
                  <a.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-white/80">{a.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Dashboard VENDEDOR ────────────────────────────────────────────────────────
function DashboardVendedor({ negociaciones, reportes, userId }: { negociaciones: any[]; reportes: any; userId: number }) {
  const router = useRouter();
  const kpis = reportes?.kpis ?? {};
  const misIngresosPorMes = reportes?.misIngresosPorMes ?? [];
  const recientes = negociaciones.slice(0, 5);

  const propuestasPendientes = negociaciones.filter(n => n.estado === 'ESPERANDO_CONFIRMACION');

  return (
    <div className="space-y-6">
      {/* Alerta propuestas pendientes */}
      {propuestasPendientes.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-yellow-800">
                {propuestasPendientes.length} propuesta{propuestasPendientes.length > 1 ? 's' : ''} esperando tu respuesta
              </p>
              <p className="text-xs text-yellow-600">No olvides revisar y aceptar o rechazar</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/envios')}
            className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-xl hover:bg-yellow-600 transition-colors flex-shrink-0">
            Revisar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Mis ventas totales"   value={kpis.totalFacturado ?? 0}        prefix="$" icon={DollarSign}  color="bg-green-50 text-green-600"   />
        <KpiCard title="Ingresos netos"        value={kpis.totalIngresosNetos ?? 0}   prefix="$" icon={TrendingUp}  color="bg-red-50 text-red-600"       />
        <KpiCard title="Galones vendidos"      value={kpis.totalGalonesVendidos ?? 0} suffix=" gal" icon={Fuel}    color="bg-yellow-50 text-yellow-600"  />
        <KpiCard title="Tasa de aceptación"    value={kpis.tasaAceptacion ?? 0}       suffix="%" icon={CheckCircle} color="bg-blue-50 text-blue-600"     />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ingresos por mes */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />Mis ingresos mensuales
            </CardTitle>
            <CardDescription className="text-xs">Total facturado vs ingreso neto</CardDescription>
          </CardHeader>
          <CardContent>
            {misIngresosPorMes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-gray-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Acepta negociaciones para ver tus ingresos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={misIngresosPorMes}>
                  <defs>
                    <linearGradient id="gNeto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="neto"  stroke="#22c55e" fill="url(#gNeto)" strokeWidth={2} name="Neto" />
                  <Area type="monotone" dataKey="total" stroke="#ef4444" fill="transparent" strokeWidth={2} name="Total facturado" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Stats compactas */}
        <div className="space-y-3">
          {[
            { label: 'Negociaciones totales', value: kpis.totalNegociaciones ?? 0, color: 'bg-purple-50', text: 'text-purple-600' },
            { label: 'Completadas',           value: kpis.completadas ?? 0,        color: 'bg-green-50',  text: 'text-green-600'  },
            { label: 'Pendientes respuesta',  value: kpis.pendientes ?? 0,         color: 'bg-yellow-50', text: 'text-yellow-600' },
            { label: 'Rechazadas',            value: kpis.rechazadas ?? 0,         color: 'bg-red-50',    text: 'text-red-600'    },
          ].map(({ label, value, color, text }) => (
            <div key={label} className={`p-4 rounded-xl ${color} flex justify-between items-center`}>
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`text-xl font-bold ${text}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Negociaciones recientes */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Mis negociaciones recientes</CardTitle>
            <button onClick={() => router.push('/dashboard/envios')}
              className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {recientes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin negociaciones aún — explora las solicitudes de compradores</p>
              <button onClick={() => router.push('/dashboard/clientes')}
                className="mt-3 text-sm text-red-500 font-semibold hover:underline">
                Ver clientes →
              </button>
            </div>
          ) : (
            <div>{recientes.map((n: any) => <NegociacionReciente key={n.id} neg={n} userId={userId} />)}</div>
          )}
        </CardContent>
      </Card>

      {/* Accesos rápidos vendedor */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AccesoRapido label="Ver Solicitudes"   icon={ShoppingCart} color="bg-blue-50 text-blue-600"   href="/dashboard/clientes"  />
        <AccesoRapido label="Mis Propuestas"    icon={Activity}     color="bg-yellow-50 text-yellow-600" href="/dashboard/envios"   />
        <AccesoRapido label="Mis Ofertas"       icon={Package}      color="bg-green-50 text-green-600"  href="/dashboard/vendedores"/>
        <AccesoRapido label="Reportes"          icon={BarChart3}    color="bg-purple-50 text-purple-600" href="/dashboard/reportes" />
      </div>
    </div>
  );
}

// ── Dashboard COMPRADOR ───────────────────────────────────────────────────────
function DashboardComprador({ negociaciones, reportes, userId }: { negociaciones: any[]; reportes: any; userId: number }) {
  const router = useRouter();
  const kpis = reportes?.kpis ?? {};
  const miGastoPorMes = reportes?.miGastoPorMes ?? [];
  const recientes = negociaciones.slice(0, 5);

  const enviosActivos = negociaciones.filter(n => n.estado === 'CONFIRMADA' && n.envio);
  const pagosPendientes = negociaciones.filter(n =>
    n.factura?.estadoPago === 'PENDIENTE' && n.estado === 'CONFIRMADA'
  );

  return (
    <div className="space-y-6">
      {/* Alerta pagos pendientes */}
      {pagosPendientes.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-800">
                {pagosPendientes.length} pago{pagosPendientes.length > 1 ? 's' : ''} pendiente{pagosPendientes.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-red-600">Sube el comprobante para continuar el proceso</p>
            </div>
          </div>
          <button onClick={() => router.push('/dashboard/envios')}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors flex-shrink-0">
            Pagar <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total gastado"         value={kpis.totalGastado ?? 0}              prefix="$"    icon={DollarSign}   color="bg-red-50 text-red-600"        />
        <KpiCard title="Galones comprados"     value={kpis.totalGalonesComprados ?? 0}     suffix=" gal" icon={Fuel}         color="bg-yellow-50 text-yellow-600"  />
        <KpiCard title="Compras completadas"   value={kpis.completadas ?? 0}               icon={CheckCircle} color="bg-green-50 text-green-600"  />
        <KpiCard title="Tasa de completado"    value={kpis.tasaCompletado ?? 0}            suffix="%"    icon={Activity}     color="bg-blue-50 text-blue-600"      />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gasto por mes */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-500" />Mi gasto mensual en combustible
            </CardTitle>
          </CardHeader>
          <CardContent>
            {miGastoPorMes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-52 text-gray-400">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Completa compras para ver tu historial de gasto</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={miGastoPorMes}>
                  <defs>
                    <linearGradient id="gGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Gasto']} />
                  <Area type="monotone" dataKey="total" stroke="#ef4444" fill="url(#gGasto)" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} name="Gasto total" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Resumen rápido comprador */}
        <div className="space-y-3">
          {[
            { label: 'Total compras',          value: kpis.totalCompras ?? 0,     color: 'bg-purple-50', text: 'text-purple-600' },
            { label: 'En curso',               value: kpis.enCurso ?? 0,          color: 'bg-blue-50',   text: 'text-blue-600'   },
            { label: 'Promedio por compra',     value: `${kpis.promedioGalonesPorCompra ?? 0} gal`, color: 'bg-yellow-50', text: 'text-yellow-700' },
            { label: 'Canceladas/Rechazadas',   value: kpis.canceladas ?? 0,       color: 'bg-gray-50',   text: 'text-gray-600'   },
          ].map(({ label, value, color, text }) => (
            <div key={label} className={`p-4 rounded-xl ${color} flex justify-between items-center`}>
              <span className="text-sm text-gray-600">{label}</span>
              <span className={`text-lg font-bold ${text}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Envíos activos */}
      {enviosActivos.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />Mis envíos en curso
              </CardTitle>
              <button onClick={() => router.push('/dashboard/envios')}
                className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline">
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enviosActivos.slice(0, 3).map((n: any) => {
                const prog = n.envio?.progresoEstimado ?? 0;
                return (
                  <div key={n.id} className="p-3 bg-blue-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-semibold text-gray-800">{n.cantidad.toLocaleString()} gal · {n.tipoProducto}</span>
                      <span className="text-xs font-bold text-blue-600">{prog}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${prog}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{n.envio?.estadoEnvio?.replace('_', ' ')} · {n.ciudad}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Negociaciones recientes */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold">Mis compras recientes</CardTitle>
            <button onClick={() => router.push('/dashboard/envios')}
              className="text-xs text-red-500 font-semibold flex items-center gap-1 hover:underline">
              Ver todas <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {recientes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">Sin compras aún — explora las ofertas disponibles</p>
              <button onClick={() => router.push('/dashboard/vendedores')}
                className="mt-3 text-sm text-red-500 font-semibold hover:underline">
                Ver ofertas →
              </button>
            </div>
          ) : (
            <div>{recientes.map((n: any) => <NegociacionReciente key={n.id} neg={n} userId={userId} />)}</div>
          )}
        </CardContent>
      </Card>

      {/* Accesos rápidos comprador */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <AccesoRapido label="Ver Ofertas"      icon={Package}      color="bg-red-50 text-red-600"      href="/dashboard/vendedores" />
        <AccesoRapido label="Mis Compras"      icon={Activity}     color="bg-blue-50 text-blue-600"    href="/dashboard/envios"     />
        <AccesoRapido label="Mis Solicitudes"  icon={ShoppingCart} color="bg-yellow-50 text-yellow-600" href="/dashboard/clientes"  />
        <AccesoRapido label="Reportes"         icon={BarChart3}    color="bg-purple-50 text-purple-600" href="/dashboard/reportes"  />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user, initializing } = useAuth();
  const { isLoading, showWelcome, handlePreloaderComplete, completeWelcome } = useOnboarding(user?.email);

  const [stats, setStats]           = useState<any>(null);
  const [reportes, setReportes]     = useState<any>(null);
  const [negociaciones, setNegociaciones] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [dashboardVisible, setDashboardVisible] = useState(false);

  const rol = (user as any)?.role ?? '';
  const userId = user ? Number((user as any).userId ?? (user as any).id ?? 0) : 0;
  const esAdmin = rol === 'ADMIN' || rol === 'SUPER_ADMIN';

  const cargarDatos = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingData(true);
      const promesas: Promise<any>[] = [getReportes()];
      if (esAdmin) promesas.push(getAdminStats());
      else promesas.push(getMisNegociaciones());

      const [rep, extra] = await Promise.all(promesas);
      setReportes(rep);
      if (esAdmin) setStats(extra);
      else setNegociaciones(extra ?? []);
    } catch (e) {
      console.error('Error cargando dashboard:', e);
    } finally {
      setLoadingData(false);
    }
  }, [user, esAdmin]);

  useEffect(() => {
    if (!initializing && user) {
      cargarDatos();
      setDashboardVisible(true);
    }
  }, [initializing, user, cargarDatos]);

  if (isLoading) return <Preloader onComplete={handlePreloaderComplete} />;

  const nombre = user?.name?.split(' ')[0] || 'Usuario';

  return (
    <>
      {showWelcome && (
        <WelcomeModal userName={nombre} onClose={completeWelcome} />
      )}

      <div className={`space-y-6 transition-all duration-500 ${dashboardVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              ¡Bienvenido, {nombre}! 👋
            </h2>
            <p className="text-gray-500 text-sm">
              {esAdmin
                ? 'Vista completa del sistema ERP'
                : rol === 'VENDEDOR'
                ? 'Tu panel de ventas y negociaciones'
                : 'Tu panel de compras y envíos'}
            </p>
          </div>
          <button onClick={cargarDatos} disabled={loadingData}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 self-start lg:self-auto">
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Loading */}
        {(loadingData || initializing) && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            <span className="ml-3 text-gray-500">Cargando tus datos...</span>
          </div>
        )}

        {/* Contenido por rol */}
        {!loadingData && !initializing && (
          <>
            {esAdmin && (
              <DashboardAdmin stats={stats} reportes={reportes} />
            )}
            {rol === 'VENDEDOR' && (
              <DashboardVendedor negociaciones={negociaciones} reportes={reportes} userId={userId} />
            )}
            {rol === 'COMPRADOR' && (
              <DashboardComprador negociaciones={negociaciones} reportes={reportes} userId={userId} />
            )}
          </>
        )}
      </div>
    </>
  );
}