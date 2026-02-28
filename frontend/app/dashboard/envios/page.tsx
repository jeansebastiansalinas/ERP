'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Calendar,
  TrendingUp,
  X,
  Loader2,
  DollarSign,
  ChevronDown,
  FileText,
  Fuel,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

import {
  getMisNegociaciones,
  aceptarNegociacion,
  rechazarNegociacion,
  cancelarNegociacion,
  type Negociacion,
  type EstadoNegociacion,
} from '@/services/negociaciones.service';

// ── Helpers visuales ─────────────────────────────────────────────────────────

const ESTADO_ENVIO_CONFIG: Record<string, { label: string; color: string; bg: string; progreso: number }> = {
  PENDIENTE:       { label: 'Pendiente',       color: 'text-yellow-700', bg: 'bg-yellow-100', progreso: 5  },
  PAGADO:          { label: 'Pagado',          color: 'text-blue-700',   bg: 'bg-blue-100',   progreso: 25 },
  EN_PREPARACION:  { label: 'En preparación',  color: 'text-orange-700', bg: 'bg-orange-100', progreso: 50 },
  EN_TRANSITO:     { label: 'En tránsito',     color: 'text-purple-700', bg: 'bg-purple-100', progreso: 75 },
  ENTREGADO:       { label: 'Entregado',       color: 'text-green-700',  bg: 'bg-green-100',  progreso: 100},
  CANCELADO:       { label: 'Cancelado',       color: 'text-red-700',    bg: 'bg-red-100',    progreso: 0  },
};

const ESTADO_PAGO_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:          { label: 'Pago pendiente',    color: 'text-yellow-700', bg: 'bg-yellow-100' },
  COMPROBANTE_SUBIDO: { label: 'Comprobante subido',color: 'text-blue-700',   bg: 'bg-blue-100'   },
  VERIFICANDO:        { label: 'Verificando',        color: 'text-orange-700', bg: 'bg-orange-100' },
  CONFIRMADO:         { label: 'Pago confirmado',    color: 'text-green-700',  bg: 'bg-green-100'  },
  RECHAZADO:          { label: 'Pago rechazado',     color: 'text-red-700',    bg: 'bg-red-100'    },
};

// ── Componente progreso visual ────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ── Componente tarjeta de propuesta pendiente ─────────────────────────────────

function TarjetaPropuesta({
  negociacion,
  userId,
  onAceptar,
  onRechazar,
  onCancelar,
}: {
  negociacion: Negociacion;
  userId: number;
  onAceptar: (id: string) => void;
  onRechazar: (id: string) => void;
  onCancelar: (id: string) => void;
}) {
  const esVendedor = negociacion.vendedor.id === userId;
  const total = negociacion.cantidad * Number(negociacion.precioUnitario);

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Icono + info principal */}
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-red-50 rounded-xl flex-shrink-0">
              <Fuel className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">
                  {negociacion.cantidad.toLocaleString()} galones — {negociacion.tipoProducto}
                </h3>
                <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                  Esperando respuesta
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Precio/gal</p>
                  <p className="font-semibold text-gray-900">
                    ${Number(negociacion.precioUnitario).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Total propuesto</p>
                  <p className="font-bold text-red-600">
                    ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">
                    {esVendedor ? 'Comprador' : 'Vendedor'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {esVendedor ? negociacion.comprador.name : negociacion.vendedor.name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Entrega</p>
                  <p className="font-semibold text-gray-900">
                    {negociacion.ciudad}, {negociacion.pais}
                  </p>
                </div>
              </div>

              {(negociacion.notasComprador || negociacion.notasVendedor) && (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                  <span className="font-medium">Notas: </span>
                  {negociacion.notasComprador || negociacion.notasVendedor}
                </div>
              )}

              <p className="text-xs text-gray-400">
                Propuesta enviada el{' '}
                {new Date(negociacion.createdAt).toLocaleDateString('es-CO', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col gap-2 lg:w-44">
            {esVendedor ? (
              // El VENDEDOR puede aceptar o rechazar
              <>
                <button
                  onClick={() => onAceptar(negociacion.id)}
                  className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md shadow-green-500/20 transition-all text-sm"
                >
                  ✓ Aceptar propuesta
                </button>
                <button
                  onClick={() => onRechazar(negociacion.id)}
                  className="w-full h-11 rounded-xl font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-all text-sm"
                >
                  ✕ Rechazar
                </button>
              </>
            ) : (
              // El COMPRADOR puede cancelar
              <button
                onClick={() => onCancelar(negociacion.id)}
                className="w-full h-11 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition-all text-sm"
              >
                Cancelar propuesta
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Componente tarjeta de envío activo ────────────────────────────────────────

function TarjetaEnvio({ negociacion }: { negociacion: Negociacion }) {
  const envio = negociacion.envio!;
  const factura = negociacion.factura;
  const estadoConf = ESTADO_ENVIO_CONFIG[envio.estadoEnvio] ?? ESTADO_ENVIO_CONFIG.PENDIENTE;
  const progreso = envio.progresoEstimado ?? estadoConf.progreso;
  const total = negociacion.cantidad * Number(negociacion.precioUnitario);

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Info principal */}
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {negociacion.cantidad.toLocaleString()} gal — {negociacion.tipoProducto}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {negociacion.comprador.name} → {negociacion.vendedor.name}
                </p>
              </div>
              <Badge className={`${estadoConf.bg} ${estadoConf.color} border-0`}>
                {estadoConf.label}
              </Badge>
            </div>

            {/* Ruta */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-gray-700">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium">{envio.origen}</span>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-gray-300" />
              <div className="flex items-center gap-1.5 text-gray-700">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="font-medium">{envio.destino}</span>
              </div>
            </div>

            {/* Progreso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progreso del envío</span>
                <span className="font-semibold">{progreso}%</span>
              </div>
              <ProgressBar value={progreso} />
            </div>

            {/* Detalles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {envio.conductorNombre && (
                <div>
                  <p className="text-gray-500 text-xs">Conductor</p>
                  <p className="font-semibold text-gray-900">{envio.conductorNombre}</p>
                </div>
              )}
              {envio.vehiculoPlaca && (
                <div>
                  <p className="text-gray-500 text-xs">Vehículo</p>
                  <p className="font-semibold text-gray-900">{envio.vehiculoPlaca}</p>
                </div>
              )}
              {envio.fechaEntregaEst && (
                <div>
                  <p className="text-gray-500 text-xs">Entrega estimada</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(envio.fechaEntregaEst).toLocaleDateString('es-CO', {
                      day: '2-digit', month: 'short',
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-gray-500 text-xs">Total</p>
                <p className="font-bold text-red-600">
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Panel factura */}
          {factura && (
            <div className="lg:w-52 space-y-2">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="font-semibold text-gray-700 text-xs uppercase tracking-wide">
                    Factura
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${Number(factura.subtotal).toLocaleString()}</span>
                </div>
                {Number(factura.costoFlete) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Flete</span>
                    <span className="font-medium">${Number(factura.costoFlete).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Comisión (2%)</span>
                  <span className="font-medium">${Number(factura.comisionPlataforma).toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-red-600">${Number(factura.total).toLocaleString()}</span>
                </div>

                {/* Estado pago */}
                {(() => {
                  const pConf = ESTADO_PAGO_CONFIG[factura.estadoPago] ?? ESTADO_PAGO_CONFIG.PENDIENTE;
                  return (
                    <div className={`mt-2 px-3 py-1.5 rounded-lg ${pConf.bg}`}>
                      <p className={`text-xs font-semibold ${pConf.color}`}>{pConf.label}</p>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function EnviosPage() {
  const { user } = useAuth();
  const userId = user?.id as number;

  const [negociaciones, setNegociaciones] = useState<Negociacion[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [successMsg, setSuccessMsg]       = useState<string | null>(null);
  const [procesando, setProcesando]       = useState<string | null>(null); // id en proceso

  useEffect(() => { cargarNegociaciones(); }, []);

  async function cargarNegociaciones() {
    try {
      setLoading(true);
      setError(null);
      const data = await getMisNegociaciones();
      setNegociaciones(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar negociaciones');
    } finally {
      setLoading(false);
    }
  }

  function toast(msg: string) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  async function handleAceptar(id: string) {
    setProcesando(id);
    try {
      await aceptarNegociacion(id);
      toast('✅ ¡Propuesta aceptada! El envío fue creado automáticamente.');
      await cargarNegociaciones();
    } catch (err: any) {
      toast(`❌ ${err.message}`);
    } finally {
      setProcesando(null);
    }
  }

  async function handleRechazar(id: string) {
    setProcesando(id);
    try {
      await rechazarNegociacion(id);
      toast('Propuesta rechazada.');
      await cargarNegociaciones();
    } catch (err: any) {
      toast(`❌ ${err.message}`);
    } finally {
      setProcesando(null);
    }
  }

  async function handleCancelar(id: string) {
    setProcesando(id);
    try {
      await cancelarNegociacion(id);
      toast('Propuesta cancelada.');
      await cargarNegociaciones();
    } catch (err: any) {
      toast(`❌ ${err.message}`);
    } finally {
      setProcesando(null);
    }
  }

  // ── Filtrar por búsqueda ──────────────────────
  const filtrar = (lista: Negociacion[]) =>
    lista.filter((n) => {
      const q = searchTerm.toLowerCase();
      return (
        n.tipoProducto.toLowerCase().includes(q) ||
        n.ciudad.toLowerCase().includes(q) ||
        n.vendedor.name.toLowerCase().includes(q) ||
        n.comprador.name.toLowerCase().includes(q)
      );
    });

  // ── Separar por estado ────────────────────────
  const propuestasPendientes = filtrar(
    negociaciones.filter((n) => n.estado === 'ESPERANDO_CONFIRMACION'),
  );
  const enviosActivos = filtrar(
    negociaciones.filter(
      (n) => n.estado === 'CONFIRMADA' && n.envio?.estadoEnvio !== 'ENTREGADO',
    ),
  );
  const historial = filtrar(
    negociaciones.filter(
      (n) =>
        n.estado === 'RECHAZADA' ||
        n.estado === 'CANCELADA' ||
        n.estado === 'COMPLETADA' ||
        (n.estado === 'CONFIRMADA' && n.envio?.estadoEnvio === 'ENTREGADO'),
    ),
  );

  // ── Stats ─────────────────────────────────────
  const totalVolumen = negociaciones
    .filter((n) => n.estado === 'CONFIRMADA')
    .reduce((acc, n) => acc + n.cantidad * Number(n.precioUnitario), 0);

  const enviosEntregados = negociaciones.filter(
    (n) => n.envio?.estadoEnvio === 'ENTREGADO',
  ).length;

  return (
    <div className="space-y-6">

      {/* Toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-top-2">
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envíos y Negociaciones</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tus propuestas, tratos activos y facturación
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Propuestas pendientes</p>
                <p className="text-3xl font-bold text-gray-900">{propuestasPendientes.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Envíos activos</p>
                <p className="text-3xl font-bold text-gray-900">{enviosActivos.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Entregados</p>
                <p className="text-3xl font-bold text-gray-900">{enviosEntregados}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Volumen confirmado</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totalVolumen > 0
                    ? totalVolumen.toLocaleString('en-US', { maximumFractionDigits: 0 })
                    : '0'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <TrendingUp className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Buscador */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="search"
              placeholder="Buscar por tipo de combustible, ciudad, comprador o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <span className="ml-3 text-gray-600">Cargando negociaciones...</span>
        </div>
      )}
      {error && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-500 mb-3">{error}</p>
          <Button variant="outline" onClick={cargarNegociaciones}>
            Reintentar
          </Button>
        </div>
      )}

      {/* Tabs */}
      {!loading && !error && (
        <Tabs defaultValue="propuestas" className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1 gap-1">
            <TabsTrigger value="propuestas" className="relative gap-2">
              Propuestas
              {propuestasPendientes.length > 0 && (
                <span className="ml-1 min-w-[20px] h-5 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {propuestasPendientes.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activos">
              Envíos activos
              {enviosActivos.length > 0 && (
                <span className="ml-1 min-w-[20px] h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {enviosActivos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial">
              Historial
            </TabsTrigger>
          </TabsList>

          {/* ── Tab: Propuestas pendientes ── */}
          <TabsContent value="propuestas" className="space-y-4">
            {propuestasPendientes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Sin propuestas pendientes</p>
                <p className="text-sm text-gray-400 mt-1">
                  Cuando alguien te envíe una propuesta aparecerá aquí
                </p>
              </div>
            ) : (
              propuestasPendientes.map((n) => (
                <TarjetaPropuesta
                  key={n.id}
                  negociacion={n}
                  userId={userId}
                  onAceptar={handleAceptar}
                  onRechazar={handleRechazar}
                  onCancelar={handleCancelar}
                />
              ))
            )}
          </TabsContent>

          {/* ── Tab: Envíos activos ── */}
          <TabsContent value="activos" className="space-y-4">
            {enviosActivos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Sin envíos activos</p>
                <p className="text-sm text-gray-400 mt-1">
                  Los envíos aparecerán aquí una vez que se acepte una propuesta
                </p>
              </div>
            ) : (
              enviosActivos.map((n) => (
                <TarjetaEnvio key={n.id} negociacion={n} />
              ))
            )}
          </TabsContent>

          {/* ── Tab: Historial ── */}
          <TabsContent value="historial" className="space-y-4">
            {historial.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">Sin historial aún</p>
              </div>
            ) : (
              historial.map((n) => {
                const esCompletado = n.envio?.estadoEnvio === 'ENTREGADO';
                return (
                  <Card key={n.id} className="border-0 shadow-md opacity-80">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${esCompletado ? 'bg-green-50' : 'bg-gray-100'}`}>
                            {esCompletado
                              ? <CheckCircle className="w-5 h-5 text-green-500" />
                              : <X className="w-5 h-5 text-gray-400" />}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">
                              {n.cantidad.toLocaleString()} gal — {n.tipoProducto}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {n.comprador.name} · {n.ciudad}, {n.pais}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            esCompletado
                              ? 'bg-green-100 text-green-700 border-0'
                              : n.estado === 'RECHAZADA'
                              ? 'bg-red-100 text-red-700 border-0'
                              : 'bg-gray-100 text-gray-600 border-0'
                          }>
                            {esCompletado ? 'Entregado' : n.estado === 'RECHAZADA' ? 'Rechazada' : 'Cancelada'}
                          </Badge>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(n.updatedAt).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}