'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package, Truck, MapPin, Clock, CheckCircle, AlertCircle,
  Search, TrendingUp, X, Loader2, DollarSign, FileText,
  Fuel, ChevronDown, Upload, CreditCard, Copy, Check,
  AlertTriangle, RefreshCw, Shield, ArrowRight,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { ReciboPDF } from '@/components/ReciboPDF';
import {
  getMisNegociaciones, getAllNegociaciones, aceptarNegociacion, rechazarNegociacion,
  cancelarNegociacion, subirComprobante, confirmarPago, rechazarPago,
  liberarFondos, cambiarEstadoEnvio, type Negociacion,
} from '@/services/negociaciones.service';

// ── constantes visuales ───────────────────────────────────────────────────────

const ESTADO_ENVIO_CFG: Record<string, { label: string; color: string; bg: string; progreso: number }> = {
  PENDIENTE:      { label: 'Pendiente de pago', color: 'text-yellow-700', bg: 'bg-yellow-100', progreso: 5  },
  PAGADO:         { label: 'Pagado',            color: 'text-blue-700',   bg: 'bg-blue-100',   progreso: 25 },
  EN_PREPARACION: { label: 'En preparación',    color: 'text-orange-700', bg: 'bg-orange-100', progreso: 50 },
  EN_TRANSITO:    { label: 'En tránsito',        color: 'text-purple-700', bg: 'bg-purple-100', progreso: 75 },
  ENTREGADO:      { label: 'Entregado',          color: 'text-green-700',  bg: 'bg-green-100',  progreso: 100},
  CANCELADO:      { label: 'Cancelado',          color: 'text-red-700',    bg: 'bg-red-100',    progreso: 0  },
};

const ESTADO_PAGO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  PENDIENTE:           { label: 'Pago pendiente',     color: 'text-yellow-700', bg: 'bg-yellow-100' },
  COMPROBANTE_SUBIDO:  { label: 'Comprobante subido', color: 'text-blue-700',   bg: 'bg-blue-100'   },
  VERIFICANDO:         { label: 'Verificando',         color: 'text-orange-700', bg: 'bg-orange-100' },
  CONFIRMADO:          { label: 'Pago confirmado',     color: 'text-green-700',  bg: 'bg-green-100'  },
  RECHAZADO:           { label: 'Comprobante rechazado', color: 'text-red-700', bg: 'bg-red-100'    },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all duration-700"
        style={{ width: `${value}%` }} />
    </div>
  );
}

function copyToClipboard(text: string, setCopied: (v: boolean) => void) {
  navigator.clipboard.writeText(text);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
}

// ── Modal: Aceptar/Rechazar propuesta (VENDEDOR) ──────────────────────────────
function ModalResponderPropuesta({
  negociacion, onClose, onAceptar, onRechazar, loading,
}: {
  negociacion: Negociacion;
  onClose: () => void;
  onAceptar: (notas: string) => void;
  onRechazar: (motivo: string) => void;
  loading: boolean;
}) {
  const [notas, setNotas]   = useState('');
  const [motivo, setMotivo] = useState('');
  const [vista, setVista]   = useState<'detalle' | 'rechazar'>('detalle');
  const total = negociacion.cantidad * Number(negociacion.precioUnitario);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-xl">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Propuesta recibida</h2>
              <p className="text-xs text-gray-400">Revisa los detalles antes de responder</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="h-px bg-gray-100" />

        {vista === 'detalle' ? (
          <>
            {/* Detalles */}
            <div className="px-6 py-5 space-y-4">
              {/* Resumen de la propuesta */}
              <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Propuesta de compra</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">
                    {negociacion.cantidad.toLocaleString()}
                  </span>
                  <span className="text-lg font-semibold text-gray-600">galones</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-lg font-semibold text-gray-700">{negociacion.tipoProducto}</span>
                </div>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (${Number(negociacion.precioUnitario).toFixed(2)}/gal)
                  </span>
                </p>
              </div>

              {/* Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-0.5">Comprador</p>
                  <p className="font-semibold text-gray-800">{negociacion.comprador.name}</p>
                  <p className="text-xs text-gray-400">{negociacion.comprador.email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-0.5">Entrega en</p>
                  <p className="font-semibold text-gray-800">{negociacion.ciudad}</p>
                  <p className="text-xs text-gray-400">{negociacion.direccionEntrega}</p>
                </div>
              </div>

              {negociacion.notasComprador && (
                <div className="p-3 bg-blue-50 rounded-xl text-sm">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Notas del comprador</p>
                  <p className="text-gray-700">{negociacion.notasComprador}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Notas para el comprador (opcional)
                </label>
                <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Listo para despachar el lunes..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            </div>

            {/* Acciones */}
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setVista('rechazar')} disabled={loading}
                className="flex-1 h-11 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors">
                ✕ Rechazar
              </button>
              <button onClick={() => onAceptar(notas)} disabled={loading}
                className="flex-1 h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Aceptando...</> : '✓ Aceptar propuesta'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">El comprador recibirá una notificación y podrá enviar una nueva propuesta.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                  Motivo del rechazo (opcional)
                </label>
                <textarea rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: No tengo disponibilidad para esa fecha..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setVista('detalle')} disabled={loading}
                className="flex-1 h-11 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                Volver
              </button>
              <button onClick={() => onRechazar(motivo)} disabled={loading}
                className="flex-1 h-11 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Rechazando...</> : 'Confirmar rechazo'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Modal: Panel de pago (COMPRADOR) ─────────────────────────────────────────
function ModalPago({
  negociacion, onClose, onSubirComprobante, loading,
}: {
  negociacion: Negociacion;
  onClose: () => void;
  onSubirComprobante: (url: string, metodo: string) => void;
  loading: boolean;
}) {
  const [metodo, setMetodo]         = useState('');
  const [comprobante, setComprobante] = useState('');
  const [copiedCuenta, setCopiedCuenta] = useState(false);
  const factura = negociacion.factura!;

  const METODOS_PAGO = [
    { id: 'Nequi',       cuenta: '310 555 1234', label: 'Nequi', color: 'bg-purple-500' },
    { id: 'Bancolombia', cuenta: '123-456789-00', label: 'Bancolombia', color: 'bg-yellow-500' },
    { id: 'Davivienda',  cuenta: '0012-3456-7890', label: 'Davivienda', color: 'bg-red-500' },
    { id: 'Efectivo',    cuenta: '',              label: 'Efectivo / Otro', color: 'bg-gray-500' },
  ];

  const metodoSeleccionado = METODOS_PAGO.find((m) => m.id === metodo);

  const yaSubio = factura.estadoPago === 'COMPROBANTE_SUBIDO' ||
    factura.estadoPago === 'VERIFICANDO' ||
    factura.estadoPago === 'CONFIRMADO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-xl"><CreditCard className="w-5 h-5 text-green-600" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Realizar pago</h2>
              <p className="text-xs text-gray-400">Selecciona el método y sube tu comprobante</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="h-px bg-gray-100" />

        <div className="overflow-y-auto max-h-[calc(90vh-120px)] px-6 py-5 space-y-5">
          {/* Resumen factura */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="font-bold text-gray-700 text-xs uppercase tracking-wide">Resumen de pago</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Subtotal ({negociacion.cantidad.toLocaleString()} gal × ${Number(negociacion.precioUnitario).toFixed(2)})</span>
              <span className="font-semibold">${Number(factura.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            {Number(factura.costoFlete) > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Flete</span>
                <span className="font-semibold">${Number(factura.costoFlete).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Comisión plataforma (2%)</span>
              <span className="font-semibold">${Number(factura.comisionPlataforma).toFixed(2)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="font-bold text-gray-900 text-base">TOTAL A PAGAR</span>
              <span className="font-bold text-red-600 text-xl">${Number(factura.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {yaSubio ? (
            <div className={`p-4 rounded-xl border ${
              factura.estadoPago === 'CONFIRMADO'
                ? 'bg-green-50 border-green-200'
                : factura.estadoPago === 'COMPROBANTE_SUBIDO'
                ? 'bg-blue-50 border-blue-200'
                : 'bg-orange-50 border-orange-200'
            }`}>
              <div className="flex items-center gap-3">
                {factura.estadoPago === 'CONFIRMADO'
                  ? <CheckCircle className="w-6 h-6 text-green-600" />
                  : <Clock className="w-6 h-6 text-blue-600" />}
                <div>
                  <p className="font-semibold text-gray-800">
                    {ESTADO_PAGO_CFG[factura.estadoPago]?.label}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {factura.estadoPago === 'CONFIRMADO'
                      ? 'Tu pago fue verificado. El vendedor preparará el pedido.'
                      : 'El admin está revisando tu comprobante. Recibirás una notificación.'}
                  </p>
                  {factura.comprobanteURL && (
                    <a href={factura.comprobanteURL} target="_blank" rel="noreferrer"
                      className="text-xs text-blue-600 underline mt-1 inline-block">
                      Ver comprobante subido →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Selección de método */}
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  1. Selecciona el método de pago
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {METODOS_PAGO.map((m) => (
                    <button key={m.id} onClick={() => setMetodo(m.id)}
                      className={`p-3 rounded-xl border-2 transition-all text-left ${
                        metodo === m.id
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}>
                      <div className={`w-6 h-6 ${m.color} rounded-full mb-2`} />
                      <p className="text-sm font-semibold text-gray-800">{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Datos de cuenta */}
              {metodoSeleccionado?.cuenta && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
                    2. Realiza la transferencia a:
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">N° de cuenta / Número</p>
                      <p className="text-lg font-bold text-gray-900 font-mono">{metodoSeleccionado.cuenta}</p>
                      <p className="text-xs text-gray-400 mt-0.5">A nombre de: ERP Business Insight S.A.S</p>
                    </div>
                    <button onClick={() => copyToClipboard(metodoSeleccionado.cuenta, setCopiedCuenta)}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
                      {copiedCuenta ? <Check className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5 text-blue-600" />}
                    </button>
                  </div>
                  <p className="text-xs font-bold text-blue-700 mt-2">
                    Monto exacto: ${Number(factura.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              {/* Subir comprobante */}
              {metodo && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    3. Sube el URL de tu comprobante
                  </p>
                  <input type="url" value={comprobante}
                    onChange={(e) => setComprobante(e.target.value)}
                    placeholder="https://drive.google.com/tu-comprobante o URL de imagen"
                    className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <p className="text-xs text-gray-400 mt-1">
                    Sube la imagen a Google Drive, Dropbox o cualquier nube y pega el enlace aquí.
                  </p>
                </div>
              )}

              <button
                onClick={() => onSubirComprobante(comprobante, metodo)}
                disabled={loading || !metodo || !comprobante}
                className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : <><Upload className="w-4 h-4" />Confirmar pago</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Modal: Panel Admin — confirmar pago + cambiar estado envío ───────────────
function ModalAdmin({
  negociacion, onClose, onConfirmarPago, onRechazarPago, onLiberarFondos,
  onCambiarEstado, loading,
}: {
  negociacion: Negociacion;
  onClose: () => void;
  onConfirmarPago: () => void;
  onRechazarPago: (motivo: string) => void;
  onLiberarFondos: () => void;
  onCambiarEstado: (estadoEnvio: string, extras: any) => void;
  loading: boolean;
}) {
  const [motivoRechazo, setMotivoRechazo]   = useState('');
  const [nuevoEstado, setNuevoEstado]       = useState('');
  const [conductorNombre, setConductor]     = useState('');
  const [vehiculoPlaca, setPlaca]           = useState('');
  const [observaciones, setObs]             = useState('');
  const [tabActivo, setTabActivo]           = useState<'pago' | 'envio'>('pago');

  const factura = negociacion.factura;
  const envio   = negociacion.envio;

  const ESTADOS_ENVIO = [
    { value: 'PENDIENTE',      label: 'Pendiente de pago',  color: 'bg-yellow-100 text-yellow-700' },
    { value: 'PAGADO',         label: 'Pagado',             color: 'bg-blue-100 text-blue-700'     },
    { value: 'EN_PREPARACION', label: 'En preparación',     color: 'bg-orange-100 text-orange-700' },
    { value: 'EN_TRANSITO',    label: 'En tránsito',        color: 'bg-purple-100 text-purple-700' },
    { value: 'ENTREGADO',      label: 'Entregado',          color: 'bg-green-100 text-green-700'   },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-xl"><Shield className="w-5 h-5 text-orange-600" /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Panel Admin</h2>
              <p className="text-xs text-gray-400">{negociacion.comprador.name} → {negociacion.vendedor.name} · {negociacion.cantidad.toLocaleString()} gal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {(['pago', 'envio'] as const).map((tab) => (
            <button key={tab} onClick={() => setTabActivo(tab)}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                tabActivo === tab
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab === 'pago' ? '💳 Gestión de pago' : '🚛 Estado del envío'}
              {tab === 'pago' && factura?.estadoPago === 'COMPROBANTE_SUBIDO' && (
                <span className="ml-2 w-2 h-2 bg-orange-500 rounded-full inline-block" />
              )}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 py-5 space-y-4">

          {/* ── TAB PAGO ── */}
          {tabActivo === 'pago' && factura && (
            <div className="space-y-4">
              {/* Resumen */}
              <div className="p-4 bg-gray-50 rounded-xl text-sm space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">${Number(factura.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                {Number(factura.costoFlete) > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Flete</span><span>${Number(factura.costoFlete).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Comisión (2%)</span>
                  <span>${Number(factura.comisionPlataforma).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-red-600 text-lg">${Number(factura.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Estado pago */}
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado del pago</p>
                <span className={`text-[10px] px-2 py-1 rounded-full font-semibold ${ESTADO_PAGO_CFG[factura.estadoPago]?.bg} ${ESTADO_PAGO_CFG[factura.estadoPago]?.color}`}>
                  {ESTADO_PAGO_CFG[factura.estadoPago]?.label}
                </span>
              </div>

              {/* Método y comprobante */}
              {factura.metodoPago && (
                <p className="text-sm text-gray-500">Método: <span className="font-semibold text-gray-800">{factura.metodoPago}</span></p>
              )}
              {factura.comprobanteURL && (
                <a href={factura.comprobanteURL} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 hover:bg-blue-100 transition-colors">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium flex-1 truncate">Ver comprobante del comprador</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0" />
                </a>
              )}

              {/* Acciones según estado */}
              {factura.estadoPago === 'COMPROBANTE_SUBIDO' && (
                <div className="space-y-3 pt-1">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>El comprador subió el comprobante. Revísalo y confirma o rechaza.</span>
                  </div>
                  <input type="text" value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Motivo de rechazo (si aplica)..."
                    className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <div className="flex gap-2">
                    <button onClick={() => onRechazarPago(motivoRechazo)} disabled={loading}
                      className="flex-1 h-10 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100 text-sm">
                      ✕ Rechazar
                    </button>
                    <button onClick={onConfirmarPago} disabled={loading}
                      className="flex-1 h-10 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 flex items-center justify-center gap-1 text-sm">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '✓ Confirmar pago'}
                    </button>
                  </div>
                </div>
              )}

              {factura.estadoPago === 'CONFIRMADO' && !factura.fondosLiberados && (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Pago confirmado. Libera los fondos al vendedor una vez entregado el pedido.</span>
                  </div>
                  <button onClick={onLiberarFondos} disabled={loading}
                    className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Liberando...</> : <><DollarSign className="w-4 h-4" />Liberar fondos al vendedor</>}
                  </button>
                </div>
              )}

              {factura.fondosLiberados && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">Fondos liberados ✓</p>
                    <p className="text-xs text-green-600 mt-0.5">Negociación completada exitosamente</p>
                  </div>
                </div>
              )}

              {factura.estadoPago === 'PENDIENTE' && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
                  Esperando que el comprador suba el comprobante de pago.
                </div>
              )}
            </div>
          )}

          {/* ── TAB ENVÍO ── */}
          {tabActivo === 'envio' && (
            <div className="space-y-4">
              {/* Estado actual */}
              {envio && (
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado actual</p>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${ESTADO_ENVIO_CFG[envio.estadoEnvio]?.bg} ${ESTADO_ENVIO_CFG[envio.estadoEnvio]?.color}`}>
                      {ESTADO_ENVIO_CFG[envio.estadoEnvio]?.label}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <ProgressBar value={envio.progresoEstimado ?? ESTADO_ENVIO_CFG[envio.estadoEnvio]?.progreso ?? 0} />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div><span className="text-gray-400">Origen: </span>{envio.origen}</div>
                    <div><span className="text-gray-400">Destino: </span>{envio.destino}</div>
                    {envio.conductorNombre && <div><span className="text-gray-400">Conductor: </span>{envio.conductorNombre}</div>}
                    {envio.vehiculoPlaca && <div><span className="text-gray-400">Placa: </span>{envio.vehiculoPlaca}</div>}
                  </div>
                </div>
              )}

              {/* Cambiar estado */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Cambiar estado del envío</p>
                <div className="grid grid-cols-1 gap-2">
                  {ESTADOS_ENVIO.map((e) => (
                    <button key={e.value} onClick={() => setNuevoEstado(e.value)}
                      className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                        nuevoEstado === e.value
                          ? 'border-red-400 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        nuevoEstado === e.value ? 'bg-red-500' : 'bg-gray-300'
                      }`} />
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${e.color}`}>
                        {e.label}
                      </span>
                      {envio?.estadoEnvio === e.value && (
                        <span className="ml-auto text-[10px] text-gray-400 font-medium">ACTUAL</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Datos logísticos (opcionales) */}
                {nuevoEstado && (nuevoEstado === 'EN_PREPARACION' || nuevoEstado === 'EN_TRANSITO') && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Datos logísticos (opcional)</p>
                    <input type="text" value={conductorNombre} onChange={(e) => setConductor(e.target.value)}
                      placeholder="Nombre del conductor"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    <input type="text" value={vehiculoPlaca} onChange={(e) => setPlaca(e.target.value)}
                      placeholder="Placa del vehículo"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    <input type="text" value={observaciones} onChange={(e) => setObs(e.target.value)}
                      placeholder="Observaciones (opcional)"
                      className="w-full h-9 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>
                )}

                <button
                  onClick={() => onCambiarEstado(nuevoEstado, { conductorNombre, vehiculoPlaca, observaciones })}
                  disabled={loading || !nuevoEstado || nuevoEstado === envio?.estadoEnvio}
                  className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-2 disabled:opacity-40 transition-all">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Actualizando...</> : '🚛 Actualizar estado del envío'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta propuesta ESPERANDO_CONFIRMACION ──────────────────────────────────
function TarjetaPropuesta({ negociacion, userId, isAdmin, onResponder, onCancelar }: {
  negociacion: Negociacion; userId: number; isAdmin: boolean;
  onResponder: (n: Negociacion) => void;
  onCancelar: (n: Negociacion) => void;
}) {
  const total = negociacion.cantidad * Number(negociacion.precioUnitario);

  const origenOferta  = !!(negociacion.ofertaId || negociacion.oferta);
  const quienResponde = origenOferta ? negociacion.vendedor : negociacion.comprador;
  const quienEspera   = origenOferta ? negociacion.comprador : negociacion.vendedor;
  const yoSoyResponde = Number(quienResponde.id) === Number(userId);
  const yoSoyEspera   = Number(quienEspera.id) === Number(userId);
  const labelEspera   = origenOferta ? 'Esperando al vendedor' : 'Esperando al comprador';

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-5">
          <div className="flex items-start gap-4 flex-1">
            <div className="p-3 bg-yellow-50 rounded-xl flex-shrink-0">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-gray-900">
                  {negociacion.cantidad.toLocaleString()} galones — {negociacion.tipoProducto}
                </h3>
                <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">
                  {yoSoyResponde ? '⚡ Requiere tu respuesta' : 'Esperando respuesta'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Precio/gal</p><p className="font-semibold">${Number(negociacion.precioUnitario).toFixed(2)}</p></div>
                <div><p className="text-gray-400 text-xs">Total</p><p className="font-bold text-red-600">${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p></div>
                <div>
                  <p className="text-gray-400 text-xs">{yoSoyResponde ? 'De parte de' : 'Contraparte'}</p>
                  <p className="font-semibold">{yoSoyResponde ? quienEspera.name : quienResponde.name}</p>
                </div>
                <div><p className="text-gray-400 text-xs">Entrega</p><p className="font-semibold">{negociacion.ciudad}</p></div>
              </div>
              <p className="text-xs text-gray-400">
                Enviada el {new Date(negociacion.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:w-48">
            {(yoSoyResponde || isAdmin) ? (
              <button onClick={() => onResponder(negociacion)}
                className="w-full h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md shadow-green-500/20 transition-all text-sm">
                Ver y responder →
              </button>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-center">
                <Clock className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
                <p className="text-xs text-yellow-700 font-medium">{labelEspera}</p>
              </div>
            )}
            {(yoSoyEspera || isAdmin) && (
              <button onClick={() => onCancelar(negociacion)}
                className="w-full h-9 rounded-xl font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors text-xs">
                Cancelar propuesta
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Tarjeta envío activo (CONFIRMADA) ────────────────────────────────────────
function TarjetaEnvio({ negociacion, userId, isAdmin, onPagar, onAdmin }: {
  negociacion: Negociacion; userId: number; isAdmin: boolean;
  onPagar: (n: Negociacion) => void;
  onAdmin: (n: Negociacion) => void;
}) {
  const envio   = negociacion.envio!;
  const factura = negociacion.factura;
  const estadoCfg = ESTADO_ENVIO_CFG[envio.estadoEnvio] ?? ESTADO_ENVIO_CFG.PENDIENTE;
  const progreso  = envio.progresoEstimado ?? estadoCfg.progreso;
  const total     = negociacion.cantidad * Number(negociacion.precioUnitario);
  const esComprador = negociacion.comprador.id === userId;

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-4">
            {/* Encabezado */}
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {negociacion.cantidad.toLocaleString()} gal — {negociacion.tipoProducto}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {negociacion.comprador.name} <ArrowRight className="w-3 h-3 inline" /> {negociacion.vendedor.name}
                </p>
              </div>
              <Badge className={`${estadoCfg.bg} ${estadoCfg.color} border-0`}>{estadoCfg.label}</Badge>
            </div>

            {/* Ruta */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-700">{envio.origen}</span>
              </div>
              <div className="flex-1 border-t-2 border-dashed border-gray-200" />
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-700">{envio.destino}</span>
              </div>
            </div>

            {/* Progreso */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progreso del envío</span>
                <span className="font-bold">{progreso}%</span>
              </div>
              <ProgressBar value={progreso} />
              <div className="flex justify-between text-[10px] text-gray-400">
                {['Pendiente', 'Pagado', 'Preparando', 'En tránsito', 'Entregado'].map((s, i) => (
                  <span key={s} className={i * 25 <= progreso ? 'text-red-500 font-semibold' : ''}>{s}</span>
                ))}
              </div>
            </div>

            {/* Info logística */}
            {(envio.conductorNombre || envio.vehiculoPlaca || envio.fechaEntregaEst) && (
              <div className="grid grid-cols-3 gap-3 text-sm">
                {envio.conductorNombre && <div><p className="text-xs text-gray-400">Conductor</p><p className="font-semibold text-gray-800">{envio.conductorNombre}</p></div>}
                {envio.vehiculoPlaca && <div><p className="text-xs text-gray-400">Placa</p><p className="font-semibold text-gray-800">{envio.vehiculoPlaca}</p></div>}
                {envio.fechaEntregaEst && <div><p className="text-xs text-gray-400">Entrega est.</p><p className="font-semibold text-gray-800">{new Date(envio.fechaEntregaEst).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</p></div>}
              </div>
            )}
          </div>

          {/* Panel derecho: factura + acciones */}
          <div className="lg:w-52 space-y-3">
            {factura && (
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Factura</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Subtotal</span>
                  <span>${Number(factura.subtotal).toFixed(2)}</span>
                </div>
                {Number(factura.costoFlete) > 0 && (
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Flete</span><span>${Number(factura.costoFlete).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Comisión (2%)</span>
                  <span>${Number(factura.comisionPlataforma).toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-red-600">${Number(factura.total).toFixed(2)}</span>
                </div>
                <div className={`px-2 py-1 rounded-lg ${ESTADO_PAGO_CFG[factura.estadoPago]?.bg}`}>
                  <p className={`text-[10px] font-semibold ${ESTADO_PAGO_CFG[factura.estadoPago]?.color}`}>
                    {ESTADO_PAGO_CFG[factura.estadoPago]?.label}
                  </p>
                </div>
              </div>
            )}

            {/* Acción según rol */}
            {esComprador && factura?.estadoPago === 'PENDIENTE' && (
              <button onClick={() => onPagar(negociacion)}
                className="w-full h-10 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all text-sm flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />Realizar pago
              </button>
            )}

            {esComprador && (factura?.estadoPago === 'COMPROBANTE_SUBIDO' || factura?.estadoPago === 'VERIFICANDO') && (
              <button onClick={() => onPagar(negociacion)}
                className="w-full h-10 rounded-xl font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors text-sm">
                Ver estado del pago
              </button>
            )}

            {isAdmin && (
              <button onClick={() => onAdmin(negociacion)}
                className="w-full h-10 rounded-xl font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 transition-colors text-sm flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />Panel admin
              </button>
            )}

            {/* Recibo PDF */}
            {!isAdmin && ['EN_PREPARACION', 'EN_TRANSITO', 'ENTREGADO'].includes(envio.estadoEnvio) && negociacion.factura && (
              <div className="pt-1">
                <ReciboPDF negociacion={negociacion} />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ══════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════
export default function EnviosPage() {
  const { user, initializing } = useAuth();
  const userId = user ? Number((user as any).userId ?? (user as any).id ?? 0) : 0;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const [negociaciones, setNegociaciones] = useState<Negociacion[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchTerm, setSearchTerm]       = useState('');
  const [toast, setToast]                 = useState<{ msg: string; ok: boolean } | null>(null);
  const [procesando, setProcesando]       = useState(false);

  // ── Paginación historial ──────────────────────────────────────────────────
  const HIST_PAGE_SIZE = 8;
  const [histPage, setHistPage] = useState(1);

  // Modales
  const [modalResponder, setModalResponder] = useState<Negociacion | null>(null);
  const [modalPago, setModalPago]           = useState<Negociacion | null>(null);
  const [modalAdmin, setModalAdmin]         = useState<Negociacion | null>(null);
  const [modalCancelar, setModalCancelar]   = useState<Negociacion | null>(null);

  const showToast = useCallback((msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const cargar = useCallback(async () => {
    try {
      setLoading(true); setError(null);
      const data = isAdmin
        ? await getAllNegociaciones()
        : await getMisNegociaciones();
      setNegociaciones(data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Acciones ─────────────────────────────────────

  async function handleAceptar(notas: string) {
    if (!modalResponder) return;
    setProcesando(true);
    try {
      await aceptarNegociacion(modalResponder.id, notas);
      showToast('✅ Propuesta aceptada. Se creó el envío y la factura automáticamente.');
      setModalResponder(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  async function handleRechazar(motivo: string) {
    if (!modalResponder) return;
    setProcesando(true);
    try {
      await rechazarNegociacion(modalResponder.id, motivo);
      showToast('Propuesta rechazada. El comprador fue notificado.');
      setModalResponder(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  async function handleCancelar(n: Negociacion) {
    setProcesando(true);
    try {
      await cancelarNegociacion(n.id);
      showToast('Propuesta cancelada.');
      setModalCancelar(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  async function handleSubirComprobante(url: string, metodo: string) {
    if (!modalPago) return;
    setProcesando(true);
    try {
      await subirComprobante(modalPago.id, url, metodo);
      showToast('✅ Comprobante enviado. El admin lo revisará pronto.');
      setModalPago(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  async function handleConfirmarPago() {
    if (!modalAdmin) return;
    setProcesando(true);
    try {
      await confirmarPago(modalAdmin.id);
      showToast('✅ Pago confirmado. El vendedor fue notificado.');
      setModalAdmin(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  async function handleRechazarPago(motivo: string) {
    if (!modalAdmin) return;
    setProcesando(true);
    try {
      await rechazarPago(modalAdmin.id, motivo);
      showToast('Comprobante rechazado. El comprador fue notificado.');
      setModalAdmin(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  async function handleLiberarFondos() {
    if (!modalAdmin) return;
    setProcesando(true);
    try {
      await liberarFondos(modalAdmin.id);
      showToast('✅ Fondos liberados al vendedor. Negociación completada.');
      setModalAdmin(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  async function handleCambiarEstado(estadoEnvio: string, extras: any) {
    if (!modalAdmin?.envio) return;
    setProcesando(true);
    try {
      await cambiarEstadoEnvio(modalAdmin.envio.id, { estadoEnvio, ...extras });
      showToast(`✅ Estado del envío actualizado a: ${estadoEnvio.replace('_', ' ')}`);
      setModalAdmin(null);
      await cargar();
    } catch (e: any) { showToast(e.message, false); }
    finally { setProcesando(false); }
  }

  // ── Filtros y separación ─────────────────────────

  const filtrar = (lista: Negociacion[]) => {
    const q = searchTerm.toLowerCase();
    return lista.filter((n) =>
      !q || n.tipoProducto.toLowerCase().includes(q) ||
      n.ciudad.toLowerCase().includes(q) ||
      n.vendedor.name.toLowerCase().includes(q) ||
      n.comprador.name.toLowerCase().includes(q)
    );
  };

  const propuestas = filtrar(negociaciones.filter((n) => n.estado === 'ESPERANDO_CONFIRMACION'));
  const activos    = filtrar(negociaciones.filter((n) => n.estado === 'CONFIRMADA' && n.envio?.estadoEnvio !== 'ENTREGADO'));
  const historial  = filtrar(negociaciones.filter((n) =>
    n.estado === 'RECHAZADA' || n.estado === 'CANCELADA' || n.estado === 'COMPLETADA' ||
    (n.estado === 'CONFIRMADA' && n.envio?.estadoEnvio === 'ENTREGADO')
  ));

  // ── Paginación historial ──────────────────────────────────────────────────
  const histTotalPages = Math.max(1, Math.ceil(historial.length / HIST_PAGE_SIZE));
  const histPagina     = historial.slice((histPage - 1) * HIST_PAGE_SIZE, histPage * HIST_PAGE_SIZE);

  // Resetear página si el filtro cambia y la página actual queda fuera de rango
  useEffect(() => {
    if (histPage > histTotalPages) setHistPage(1);
  }, [histTotalPages, histPage]);

  const totalVolumen = negociaciones
    .filter((n) => n.estado === 'CONFIRMADA')
    .reduce((a, n) => a + n.cantidad * Number(n.precioUnitario), 0);

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-medium animate-in slide-in-from-top-2 ${toast.ok ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envíos y Negociaciones</h1>
          <p className="text-gray-500 mt-1">Gestiona propuestas, pagos y seguimiento de envíos</p>
        </div>
        <button onClick={cargar} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
          <RefreshCw className="w-4 h-4" />Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Propuestas',    value: propuestas.length, icon: Clock,       color: 'bg-yellow-50 text-yellow-600' },
          { label: 'Envíos activos', value: activos.length,   icon: Truck,       color: 'bg-blue-50 text-blue-600' },
          { label: 'Entregados',    value: negociaciones.filter((n) => n.envio?.estadoEnvio === 'ENTREGADO').length, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
          { label: 'Vol. confirmado', value: `$${totalVolumen > 0 ? totalVolumen.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}`, icon: TrendingUp, color: 'bg-red-50 text-red-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-500 mb-1">{label}</p><p className="text-2xl font-bold text-gray-900">{value}</p></div>
                <div className={`p-2.5 rounded-xl ${color.split(' ')[0]}`}><Icon className={`w-5 h-5 ${color.split(' ')[1]}`} /></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Búsqueda */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar por tipo, ciudad, comprador o vendedor..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 h-10" />
          </div>
        </CardContent>
      </Card>

      {(loading || initializing || !user) && <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-red-500" /><span className="ml-3 text-gray-500">Cargando...</span></div>}
      {error && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-red-500 mb-3">{error}</p>
          <Button variant="outline" onClick={cargar}>Reintentar</Button>
        </div>
      )}

      {!loading && !initializing && !error && user && (
        <Tabs defaultValue="propuestas" className="space-y-5">
          <TabsList className="bg-white border shadow-sm p-1">
            <TabsTrigger value="propuestas" className="gap-2">
              Propuestas
              {propuestas.length > 0 && (
                <span className="min-w-[20px] h-5 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {propuestas.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activos" className="gap-2">
              Envíos activos
              {activos.length > 0 && (
                <span className="min-w-[20px] h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                  {activos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>

          {/* Propuestas */}
          <TabsContent value="propuestas" className="space-y-4">
            {propuestas.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Sin propuestas pendientes</p>
                <p className="text-sm text-gray-400 mt-1">Las propuestas nuevas aparecerán aquí</p>
              </div>
            ) : propuestas.map((n) => (
              <TarjetaPropuesta key={n.id} negociacion={n} userId={userId} isAdmin={isAdmin}
                onResponder={setModalResponder}
                onCancelar={setModalCancelar} />
            ))}
          </TabsContent>

          {/* Activos */}
          <TabsContent value="activos" className="space-y-4">
            {activos.length === 0 ? (
              <div className="text-center py-16">
                <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Sin envíos activos</p>
                <p className="text-sm text-gray-400 mt-1">Aquí aparecerán los envíos una vez aceptada una propuesta</p>
              </div>
            ) : activos.map((n) => (
              <TarjetaEnvio key={n.id} negociacion={n} userId={userId} isAdmin={isAdmin}
                onPagar={setModalPago} onAdmin={setModalAdmin} />
            ))}
          </TabsContent>

          {/* Historial — con paginación */}
          <TabsContent value="historial" className="space-y-3">
            {historial.length === 0 ? (
              <div className="text-center py-16">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Sin historial aún</p>
              </div>
            ) : (
              <>
                {histPagina.map((n) => {
                  const completado = n.envio?.estadoEnvio === 'ENTREGADO' || n.estado === 'COMPLETADA';
                  return (
                    <Card key={n.id} className="border-0 shadow-md opacity-80">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-2.5 rounded-xl ${completado ? 'bg-green-50' : 'bg-gray-100'}`}>
                              {completado ? <CheckCircle className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {n.cantidad.toLocaleString()} gal — {n.tipoProducto}
                              </p>
                              <p className="text-xs text-gray-500">{n.comprador.name} · {n.ciudad}, {n.pais}</p>
                              {n.factura && (
                                <p className="text-xs font-semibold text-gray-700 mt-0.5">
                                  ${Number(n.factura.total).toFixed(2)}
                                  {n.factura.fondosLiberados && <span className="ml-1 text-green-600">· Fondos liberados</span>}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <Badge className={
                              completado ? 'bg-green-100 text-green-700 border-0'
                              : n.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700 border-0'
                              : 'bg-gray-100 text-gray-600 border-0'
                            }>
                              {completado ? 'Completada' : n.estado === 'RECHAZADA' ? 'Rechazada' : 'Cancelada'}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">{new Date(n.updatedAt).toLocaleDateString('es-CO')}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Paginador */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-gray-100 mt-2">
                  <p className="text-xs text-gray-400">
                    Mostrando{' '}
                    <span className="font-semibold text-gray-600">
                      {(histPage - 1) * HIST_PAGE_SIZE + 1}–{Math.min(histPage * HIST_PAGE_SIZE, historial.length)}
                    </span>{' '}
                    de{' '}
                    <span className="font-semibold text-gray-600">{historial.length}</span> registros
                  </p>
                  {histTotalPages > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHistPage((p) => Math.max(1, p - 1))}
                        disabled={histPage === 1}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      {Array.from({ length: histTotalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setHistPage(p)}
                          className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                            p === histPage
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}>
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setHistPage((p) => Math.min(histTotalPages, p + 1))}
                        disabled={histPage === histTotalPages}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Modal confirmar cancelación */}
      {modalCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <div className="text-center mb-4">
              <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-2" />
              <h3 className="font-bold text-gray-900">¿Cancelar propuesta?</h3>
              <p className="text-sm text-gray-500 mt-1">El vendedor será notificado. Podrás enviar una nueva propuesta cuando quieras.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setModalCancelar(null)} className="flex-1 h-10 rounded-xl font-semibold text-gray-700 bg-gray-100">No volver</button>
              <button onClick={() => handleCancelar(modalCancelar)} disabled={procesando}
                className="flex-1 h-10 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 flex items-center justify-center gap-1">
                {procesando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales principales */}
      {modalResponder && (
        <ModalResponderPropuesta
          negociacion={modalResponder}
          onClose={() => setModalResponder(null)}
          onAceptar={handleAceptar}
          onRechazar={handleRechazar}
          loading={procesando}
        />
      )}

      {modalPago && (
        <ModalPago
          negociacion={modalPago}
          onClose={() => setModalPago(null)}
          onSubirComprobante={handleSubirComprobante}
          loading={procesando}
        />
      )}

      {modalAdmin && (
        <ModalAdmin
          negociacion={modalAdmin}
          onClose={() => setModalAdmin(null)}
          onConfirmarPago={handleConfirmarPago}
          onRechazarPago={handleRechazarPago}
          onLiberarFondos={handleLiberarFondos}
          onCambiarEstado={handleCambiarEstado}
          loading={procesando}
        />
      )}
    </div>
  );
}