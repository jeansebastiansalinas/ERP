'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, DollarSign, Package, Truck, Users, Fuel,
  RefreshCw, Loader2, BarChart3, PieChart as PieIcon,
  ShoppingCart, CheckCircle, AlertCircle, Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area,
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { getReportes } from '@/services/reportes.service';

// ── Paleta de colores ──────────────────────────────────────────────────────────
const COLORS_DONA   = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
const COLORS_TIPO   = { DIESEL:'#eab308', GASOLINA_CORRIENTE:'#3b82f6', GASOLINA_EXTRA:'#22c55e', JET_FUEL:'#8b5cf6', GLP:'#f97316' };
const COLOR_LINE_1  = '#ef4444';
const COLOR_LINE_2  = '#3b82f6';
const COLOR_LINE_3  = '#22c55e';
const COLOR_AREA    = '#ef4444';

// Labels legibles para estados
const ESTADO_LABELS: Record<string, string> = {
  ESPERANDO_CONFIRMACION: 'Esperando',
  CONFIRMADA:   'Confirmada',
  RECHAZADA:    'Rechazada',
  CANCELADA:    'Cancelada',
  COMPLETADA:   'Completada',
  PENDIENTE:    'Pendiente',
  PAGADO:       'Pagado',
  EN_PREPARACION: 'Preparando',
  EN_TRANSITO:  'En tránsito',
  ENTREGADO:    'Entregado',
  CANCELADO:    'Cancelado',
  COMPROBANTE_SUBIDO: 'Comprobante',
  VERIFICANDO:  'Verificando',
  CONFIRMADO:   'Confirmado',
};

// ── Tooltip personalizado ──────────────────────────────────────────────────────
const TooltipStyle = {
  backgroundColor: 'white',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  fontSize: '12px',
};

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ title, value, sub, icon: Icon, color, prefix = '', suffix = '' }: {
  title: string; value: number | string; sub?: string;
  icon: any; color: string; prefix?: string; suffix?: string;
}) {
  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-1 truncate">{title}</p>
            <p className="text-2xl font-bold text-gray-900 truncate">
              {prefix}{typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : value}{suffix}
            </p>
            {sub && <p className="text-xs text-gray-400 mt-1 truncate">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ml-3 flex-shrink-0 ${color.split(' ')[0]}`}>
            <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Dona Chart ─────────────────────────────────────────────────────────────────
function DonaChart({ data, title, desc }: { data: { name: string; value: number }[]; title: string; desc?: string }) {
  const labeled = data.map(d => ({ ...d, name: ESTADO_LABELS[d.name] ?? d.name }));
  const total = labeled.reduce((a, d) => a + d.value, 0);
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <PieIcon className="w-4 h-4 text-red-500" />{title}
        </CardTitle>
        {desc && <CardDescription className="text-xs">{desc}</CardDescription>}
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Sin datos aún</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={labeled} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                paddingAngle={3} dataKey="value">
                {labeled.map((_, i) => (
                  <Cell key={i} fill={COLORS_DONA[i % COLORS_DONA.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TooltipStyle} formatter={(v: any, n: any) => [`${v} (${Math.round(v/total*100)}%)`, n]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyChart({ height = 200 }: { height?: number }) {
  return (
    <div className={`flex flex-col items-center justify-center text-gray-400`} style={{ height }}>
      <Activity className="w-8 h-8 mb-2 opacity-30" />
      <p className="text-xs">Sin datos suficientes aún</p>
      <p className="text-[10px] mt-0.5">Realiza negociaciones para ver estadísticas</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VISTAS POR ROL
// ══════════════════════════════════════════════════════════════════════════════

// ── Vista ADMIN ────────────────────────────────────────────────────────────────
function VistaAdmin({ data }: { data: any }) {
  const { kpis, negPorEstado, ingresosPorMes, volumenPorTipo, enviosPorEstado,
          topVendedores, topCompradores, pagosPorEstado, actividadPorMes } = data;

  const volumenBarras = (volumenPorTipo ?? []).map((v: any) => ({
    tipo: v.tipo.replace('GASOLINA_', 'GAS. '),
    galones: v.galones,
    monto: Math.round(v.monto),
    fill: (COLORS_TIPO as any)[v.tipo] ?? '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Facturado"     value={kpis.totalFacturado}        prefix="$" icon={DollarSign}   color="bg-green-50 text-green-600"  />
        <KpiCard title="Comisiones Ganadas"  value={kpis.totalComisiones}       prefix="$" icon={TrendingUp}   color="bg-red-50 text-red-600"      />
        <KpiCard title="Volumen Total"       value={kpis.totalVolumenGalones}   suffix=" gal" icon={Fuel}      color="bg-yellow-50 text-yellow-600" />
        <KpiCard title="Tasa de Éxito"       value={kpis.tasaExito}             suffix="%" icon={CheckCircle}  color="bg-blue-50 text-blue-600"    />
        <KpiCard title="Negociaciones"       value={kpis.totalNegociaciones}    icon={Activity}  color="bg-purple-50 text-purple-600" />
        <KpiCard title="Completadas"         value={kpis.negociacionesCompletadas} icon={CheckCircle} color="bg-green-50 text-green-600" />
        <KpiCard title="Fondos Liberados"    value={kpis.fondosLiberados}       prefix="$" icon={DollarSign}   color="bg-orange-50 text-orange-600" />
        <KpiCard title="Vendedores Activos"  value={kpis.totalVendedores}       icon={Users}     color="bg-blue-50 text-blue-600"    />
      </div>

      <Tabs defaultValue="operaciones" className="space-y-4">
        <TabsList className="bg-white border shadow-sm p-1">
          <TabsTrigger value="operaciones">Operaciones</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="combustibles">Combustibles</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
        </TabsList>

        {/* ── TAB: Operaciones ── */}
        <TabsContent value="operaciones" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Actividad mensual — área */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-red-500" />Actividad mensual
                </CardTitle>
                <CardDescription className="text-xs">Negociaciones creadas, confirmadas y completadas</CardDescription>
              </CardHeader>
              <CardContent>
                {(actividadPorMes ?? []).length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={actividadPorMes}>
                      <defs>
                        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLOR_AREA} stopOpacity={0.15}/>
                          <stop offset="95%" stopColor={COLOR_AREA} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={TooltipStyle} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Area type="monotone" dataKey="total" stroke={COLOR_AREA} fill="url(#gTotal)" strokeWidth={2} name="Total" />
                      <Line type="monotone" dataKey="confirmadas" stroke={COLOR_LINE_2} strokeWidth={2} dot={false} name="Confirmadas" />
                      <Line type="monotone" dataKey="completadas" stroke={COLOR_LINE_3} strokeWidth={2} dot={false} name="Completadas" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Dona: negociaciones por estado */}
            <DonaChart data={negPorEstado ?? []} title="Estado de negociaciones" desc="Distribución actual" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Dona: envíos */}
            <DonaChart data={enviosPorEstado ?? []} title="Estado de envíos" desc="Todos los envíos del sistema" />
            {/* Dona: pagos */}
            <DonaChart data={pagosPorEstado ?? []} title="Estado de pagos" desc="Facturas generadas" />
          </div>
        </TabsContent>

        {/* ── TAB: Financiero ── */}
        <TabsContent value="financiero" className="space-y-4">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />Ingresos mensuales
              </CardTitle>
              <CardDescription className="text-xs">Total facturado y comisiones de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              {(ingresosPorMes ?? []).length === 0 ? <EmptyChart height={320} /> : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={ingresosPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="total"   fill={COLOR_LINE_2} radius={[4,4,0,0]} name="Total facturado" />
                    <Bar dataKey="comision" fill={COLOR_LINE_1} radius={[4,4,0,0]} name="Comisión (2%)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 bg-gradient-to-br from-green-50 to-white rounded-2xl border border-green-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total facturado</p>
              <p className="text-3xl font-bold text-green-600">${(kpis.totalFacturado ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-400 mt-1">Pagos confirmados</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-red-50 to-white rounded-2xl border border-red-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Comisiones ganadas</p>
              <p className="text-3xl font-bold text-red-600">${(kpis.totalComisiones ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-400 mt-1">2% por transacción</p>
            </div>
            <div className="p-5 bg-gradient-to-br from-blue-50 to-white rounded-2xl border border-blue-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Fondos liberados</p>
              <p className="text-3xl font-bold text-blue-600">${(kpis.fondosLiberados ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-gray-400 mt-1">Pagados a vendedores</p>
            </div>
          </div>
        </TabsContent>

        {/* ── TAB: Combustibles ── */}
        <TabsContent value="combustibles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-yellow-500" />Galones por tipo de combustible
                </CardTitle>
              </CardHeader>
              <CardContent>
                {volumenBarras.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={volumenBarras}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="tipo" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={TooltipStyle} formatter={(v: any, n: any) => [n === 'galones' ? `${Number(v).toLocaleString()} gal` : `$${Number(v).toLocaleString()}`, n]} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="galones" name="Galones" radius={[4,4,0,0]}>
                        {volumenBarras.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />Monto por tipo de combustible
                </CardTitle>
              </CardHeader>
              <CardContent>
                {volumenBarras.length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={volumenBarras} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="tipo" stroke="#94a3b8" tick={{ fontSize: 10 }} width={80} />
                      <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Monto']} />
                      <Bar dataKey="monto" name="Monto $" radius={[0,4,4,0]}>
                        {volumenBarras.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB: Usuarios ── */}
        <TabsContent value="usuarios" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top vendedores */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-red-500" />Top vendedores
                </CardTitle>
                <CardDescription className="text-xs">Por monto total vendido</CardDescription>
              </CardHeader>
              <CardContent>
                {(topVendedores ?? []).length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topVendedores} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="nombre" stroke="#94a3b8" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip contentStyle={TooltipStyle} formatter={(v: any, n: any) => [n === 'monto' ? `$${Number(v).toLocaleString()}` : `${Number(v).toLocaleString()} gal`, n]} />
                      <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="monto"    fill={COLOR_LINE_1} radius={[0,4,4,0]} name="Monto $" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Top compradores */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-500" />Top compradores
                </CardTitle>
                <CardDescription className="text-xs">Por monto total comprado</CardDescription>
              </CardHeader>
              <CardContent>
                {(topCompradores ?? []).length === 0 ? <EmptyChart /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={topCompradores} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="nombre" stroke="#94a3b8" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Monto']} />
                      <Bar dataKey="monto" fill={COLOR_LINE_2} radius={[0,4,4,0]} name="Monto $" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats de usuarios */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { l: 'Vendedores', v: kpis.totalVendedores, c: 'text-blue-600', bg: 'bg-blue-50' },
              { l: 'Compradores', v: kpis.totalCompradores, c: 'text-green-600', bg: 'bg-green-50' },
              { l: 'Ofertas publicadas', v: kpis.totalOfertas, c: 'text-yellow-600', bg: 'bg-yellow-50' },
              { l: 'Solicitudes publicadas', v: kpis.totalSolicitudes, c: 'text-purple-600', bg: 'bg-purple-50' },
            ].map(({ l, v, c, bg }) => (
              <div key={l} className={`p-5 rounded-2xl border ${bg} border-opacity-50 shadow-sm`}>
                <p className="text-xs text-gray-500 mb-1">{l}</p>
                <p className={`text-3xl font-bold ${c}`}>{v ?? 0}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Vista VENDEDOR ─────────────────────────────────────────────────────────────
function VistaVendedor({ data }: { data: any }) {
  const { kpis, misNegPorEstado, misIngresosPorMes, misVentasPorTipo,
          misTopCompradores, miActividadPorMes } = data;

  const volumenBarras = (misVentasPorTipo ?? []).map((v: any) => ({
    tipo: v.tipo.replace('GASOLINA_', 'GAS. '),
    galones: v.galones,
    monto: Math.round(v.monto),
    fill: (COLORS_TIPO as any)[v.tipo] ?? '#94a3b8',
  }));

  return (
    <div className="space-y-6">
      {/* KPIs vendedor */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Mis ventas totales"   value={kpis.totalFacturado}          prefix="$" icon={DollarSign}  color="bg-green-50 text-green-600"  />
        <KpiCard title="Ingresos netos"        value={kpis.totalIngresosNetos}      prefix="$" icon={TrendingUp}  color="bg-red-50 text-red-600"      />
        <KpiCard title="Galones vendidos"      value={kpis.totalGalonesVendidos}    suffix=" gal" icon={Fuel}    color="bg-yellow-50 text-yellow-600" />
        <KpiCard title="Tasa de aceptación"    value={kpis.tasaAceptacion}          suffix="%" icon={CheckCircle} color="bg-blue-50 text-blue-600"    />
        <KpiCard title="Total negociaciones"   value={kpis.totalNegociaciones}      icon={Activity}  color="bg-purple-50 text-purple-600" />
        <KpiCard title="Completadas"           value={kpis.completadas}             icon={CheckCircle} color="bg-green-50 text-green-600" />
        <KpiCard title="Pendientes respuesta"  value={kpis.pendientes}              icon={AlertCircle} color="bg-orange-50 text-orange-600" />
        <KpiCard title="Rechazadas"            value={kpis.rechazadas}              icon={AlertCircle} color="bg-red-50 text-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Ingresos por mes — área */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />Mis ingresos mensuales
            </CardTitle>
            <CardDescription className="text-xs">Total facturado vs ingreso neto (descontando comisión 2%)</CardDescription>
          </CardHeader>
          <CardContent>
            {(misIngresosPorMes ?? []).length === 0 ? <EmptyChart height={280} /> : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={misIngresosPorMes}>
                  <defs>
                    <linearGradient id="gNeto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_LINE_3} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={COLOR_LINE_3} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="neto"  stroke={COLOR_LINE_3} fill="url(#gNeto)" strokeWidth={2} name="Neto" />
                  <Line type="monotone" dataKey="total" stroke={COLOR_LINE_1} strokeWidth={2} dot={{ r: 3 }} name="Total facturado" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Dona estado */}
        <DonaChart data={misNegPorEstado ?? []} title="Mis negociaciones" desc="Por estado actual" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Ventas por tipo combustible */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Fuel className="w-4 h-4 text-yellow-500" />Lo que más vendo
            </CardTitle>
            <CardDescription className="text-xs">Galones por tipo de combustible</CardDescription>
          </CardHeader>
          <CardContent>
            {volumenBarras.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={volumenBarras}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="tipo" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [`${Number(v).toLocaleString()} gal`, 'Galones']} />
                  <Bar dataKey="galones" radius={[4,4,0,0]} name="Galones">
                    {volumenBarras.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top compradores */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />Mis mejores clientes
            </CardTitle>
            <CardDescription className="text-xs">Compradores que más me compran</CardDescription>
          </CardHeader>
          <CardContent>
            {(misTopCompradores ?? []).length === 0 ? <EmptyChart /> : (
              <div className="space-y-3 pt-1">
                {misTopCompradores.map((c: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-800 truncate">{c.nombre}</span>
                        <span className="text-xs font-bold text-red-600 ml-2 flex-shrink-0">${Number(c.monto).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-red-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.round((c.monto / misTopCompradores[0].monto) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actividad mensual */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-purple-500" />Mi actividad mensual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(miActividadPorMes ?? []).length === 0 ? <EmptyChart height={200} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={miActividadPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={TooltipStyle} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="total"       stroke={COLOR_LINE_1} strokeWidth={2} dot={{ r: 3 }} name="Total" />
                <Line type="monotone" dataKey="completadas" stroke={COLOR_LINE_3} strokeWidth={2} dot={{ r: 3 }} name="Completadas" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Vista COMPRADOR ────────────────────────────────────────────────────────────
function VistaComprador({ data }: { data: any }) {
  const { kpis, misComprasPorEstado, miGastoPorMes, misComprasPorTipo,
          misEnviosPorEstado, misTopVendedores, miActividadPorMes } = data;

  const comprasBarras = (misComprasPorTipo ?? []).map((v: any) => ({
    tipo: v.tipo.replace('GASOLINA_', 'GAS. '),
    galones: v.galones,
    monto: Math.round(v.monto),
    fill: (COLORS_TIPO as any)[v.tipo] ?? '#94a3b8',
  }));

  // Radar de distribución de compras
  const radarData = (misComprasPorTipo ?? []).map((v: any) => ({
    tipo: v.tipo.replace('GASOLINA_CORRIENTE', 'Corriente').replace('GASOLINA_EXTRA', 'Extra'),
    galones: v.galones,
  }));

  return (
    <div className="space-y-6">
      {/* KPIs comprador */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total gastado"         value={kpis.totalGastado}                prefix="$"    icon={DollarSign}   color="bg-red-50 text-red-600"       />
        <KpiCard title="Galones comprados"     value={kpis.totalGalonesComprados}       suffix=" gal" icon={Fuel}         color="bg-yellow-50 text-yellow-600"  />
        <KpiCard title="Promedio por compra"   value={kpis.promedioGalonesPorCompra}    suffix=" gal" icon={BarChart3}     color="bg-blue-50 text-blue-600"     />
        <KpiCard title="Tasa de completado"    value={kpis.tasaCompletado}              suffix="%"    icon={CheckCircle}  color="bg-green-50 text-green-600"   />
        <KpiCard title="Total compras"         value={kpis.totalCompras}                icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
        <KpiCard title="Completadas"           value={kpis.completadas}                 icon={CheckCircle}  color="bg-green-50 text-green-600"   />
        <KpiCard title="En curso"              value={kpis.enCurso}                     icon={Truck}        color="bg-blue-50 text-blue-600"     />
        <KpiCard title="Canceladas/Rechazadas" value={kpis.canceladas}                  icon={AlertCircle}  color="bg-gray-50 text-gray-500"     />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gasto por mes */}
        <Card className="border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-red-500" />Mi gasto mensual
            </CardTitle>
            <CardDescription className="text-xs">Evolución de lo que gastas en combustible</CardDescription>
          </CardHeader>
          <CardContent>
            {(miGastoPorMes ?? []).length === 0 ? <EmptyChart height={280} /> : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={miGastoPorMes}>
                  <defs>
                    <linearGradient id="gGasto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_LINE_1} stopOpacity={0.15}/>
                      <stop offset="95%" stopColor={COLOR_LINE_1} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Gasto']} />
                  <Area type="monotone" dataKey="total" stroke={COLOR_LINE_1} fill="url(#gGasto)" strokeWidth={2.5} name="Gasto total" dot={{ r: 3, fill: COLOR_LINE_1 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Dona: mis compras */}
        <DonaChart data={misComprasPorEstado ?? []} title="Estado de mis compras" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Radar: diversificación de combustibles */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-500" />Diversificación
            </CardTitle>
            <CardDescription className="text-xs">Tipos de combustible que compras</CardDescription>
          </CardHeader>
          <CardContent>
            {radarData.length === 0 ? <EmptyChart height={220} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="tipo" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fontSize: 9 }} />
                  <Radar name="Galones" dataKey="galones" stroke={COLOR_LINE_1} fill={COLOR_LINE_1} fillOpacity={0.2} />
                  <Tooltip contentStyle={TooltipStyle} formatter={(v: any) => [`${Number(v).toLocaleString()} gal`, '']} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Dona: envíos */}
        <DonaChart data={misEnviosPorEstado ?? []} title="Estado de mis envíos" />

        {/* Top vendedores con barras */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />Mis proveedores top
            </CardTitle>
            <CardDescription className="text-xs">Vendedores a quienes más compro</CardDescription>
          </CardHeader>
          <CardContent>
            {(misTopVendedores ?? []).length === 0 ? <EmptyChart height={220} /> : (
              <div className="space-y-3 pt-1">
                {misTopVendedores.map((v: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : 'bg-orange-50 text-orange-600'}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold text-gray-800 truncate">{v.nombre}</span>
                        <span className="text-xs font-bold text-blue-600 ml-2 flex-shrink-0">${Number(v.monto).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className="bg-blue-400 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.round((v.monto / misTopVendedores[0].monto) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Compras por combustible */}
      {comprasBarras.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Fuel className="w-4 h-4 text-yellow-500" />Lo que más compro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={comprasBarras}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tipo" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={TooltipStyle} formatter={(v: any, n: any) => [n === 'galones' ? `${Number(v).toLocaleString()} gal` : `$${Number(v).toLocaleString()}`, n]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="galones" name="Galones" radius={[4,4,0,0]}>
                  {comprasBarras.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function ReportesPage() {
  const { user, initializing } = useAuth();
  const [data, setData]         = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);

  const rol = (user as any)?.role ?? '';
  const esAdmin = rol === 'ADMIN' || rol === 'SUPER_ADMIN';

  const cargar = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      setData(await getReportes());
    } catch (e: any) {
      setError(e.message || 'Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initializing && user) cargar();
  }, [initializing, user, cargar]);

  const tituloRol = esAdmin ? 'Vista completa del sistema'
    : rol === 'VENDEDOR' ? 'Panel de ventas'
    : 'Panel de compras';

  const badgeRol = esAdmin ? { label: 'Admin', color: 'bg-red-100 text-red-700' }
    : rol === 'VENDEDOR' ? { label: 'Vendedor', color: 'bg-blue-100 text-blue-700' }
    : { label: 'Comprador', color: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${badgeRol.color}`}>
              {badgeRol.label}
            </span>
          </div>
          <p className="text-gray-500">{tituloRol}</p>
        </div>
        <button onClick={cargar} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Loading */}
      {(loading || initializing) && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="ml-3 text-gray-500">Cargando datos reales...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-16">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-500 font-medium mb-3">{error}</p>
          <button onClick={cargar}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600">
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido por rol */}
      {!loading && !error && data && (
        <>
          {esAdmin      && <VistaAdmin    data={data} />}
          {rol === 'VENDEDOR'  && <VistaVendedor  data={data} />}
          {rol === 'COMPRADOR' && <VistaComprador data={data} />}
        </>
      )}

      {/* Sin datos */}
      {!loading && !error && !data && (
        <div className="text-center py-16">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay datos disponibles aún</p>
          <p className="text-sm text-gray-400 mt-1">Realiza negociaciones para ver estadísticas</p>
        </div>
      )}
    </div>
  );
}