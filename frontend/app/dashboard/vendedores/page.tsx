'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Fuel, MapPin, Calendar, TrendingUp, Users, Package,
  X, Loader2, ChevronDown, ArrowUpDown, SlidersHorizontal, RefreshCw,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentUserId } from '@/lib/get-current-user-id';
import { createNegociacion } from '@/services/negociaciones.service';
import { getOfertas, type OfertaVenta } from '@/services/ofertas.service';
import { createSolicitud, type CreateSolicitudData } from '@/services/solicitudes.service';

// ── constantes ─────────────────────────────────────────────────────────────────
const TIPO_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DIESEL:             { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Diesel' },
  GASOLINA_CORRIENTE: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Corriente' },
  GASOLINA_EXTRA:     { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Extra' },
  JET_FUEL:           { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Jet Fuel' },
  GLP:                { bg: 'bg-orange-50', text: 'text-orange-700', label: 'GLP' },
};

const SOLICITUD_INICIAL: CreateSolicitudData = {
  tipoProducto: 'DIESEL', cantidadRequerida: 0, precioMaximo: 0,
  pais: '', ciudad: '', direccionEntrega: '', fechaRequerida: '',
  fechaExpiracion: '', descripcion: '',
};

type OrdenKey = 'reciente' | 'antiguo' | 'precio-asc' | 'precio-desc' | 'cantidad-desc' | 'cantidad-asc';

const ORDEN_OPTIONS: { value: OrdenKey; label: string }[] = [
  { value: 'reciente',      label: 'Más recientes' },
  { value: 'antiguo',       label: 'Más antiguos'  },
  { value: 'precio-asc',    label: 'Precio ↑'      },
  { value: 'precio-desc',   label: 'Precio ↓'      },
  { value: 'cantidad-desc', label: 'Mayor cantidad' },
  { value: 'cantidad-asc',  label: 'Menor cantidad' },
];

const PAGE_SIZE = 8;

function ordenar(list: OfertaVenta[], o: OrdenKey) {
  return [...list].sort((a, b) => {
    switch (o) {
      case 'reciente':      return +new Date(b.createdAt) - +new Date(a.createdAt);
      case 'antiguo':       return +new Date(a.createdAt) - +new Date(b.createdAt);
      case 'precio-asc':    return +a.precioUnitario - +b.precioUnitario;
      case 'precio-desc':   return +b.precioUnitario - +a.precioUnitario;
      case 'cantidad-desc': return b.cantidad - a.cantidad;
      case 'cantidad-asc':  return a.cantidad - b.cantidad;
    }
  });
}

// ── Paginador ──────────────────────────────────────────────────────────────────
function Pager({ cur, tot, total, pageSize, onPage }: {
  cur: number; tot: number; total: number; pageSize: number; onPage: (p: number) => void;
}) {
  if (tot <= 1) return null;
  const from = (cur - 1) * pageSize + 1;
  const to   = Math.min(cur * pageSize, total);

  const pages: (number | '...')[] = tot <= 7
    ? Array.from({ length: tot }, (_, i) => i + 1)
    : (() => {
        const p: (number | '...')[] = [1];
        if (cur > 3) p.push('...');
        for (let i = Math.max(2, cur - 1); i <= Math.min(tot - 1, cur + 1); i++) p.push(i);
        if (cur < tot - 2) p.push('...');
        p.push(tot);
        return p;
      })();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-gray-100">
      <p className="text-xs text-gray-400">
        Mostrando <span className="font-semibold text-gray-600">{from}–{to}</span> de{' '}
        <span className="font-semibold text-gray-600">{total}</span> ofertas
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(cur - 1)} disabled={cur === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) => p === '...'
          ? <span key={`d${i}`} className="w-8 text-center text-gray-400 text-sm">…</span>
          : <button key={p} onClick={() => onPage(p as number)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                p === cur ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
              }`}>{p}</button>
        )}
        <button onClick={() => onPage(cur + 1)} disabled={cur === tot}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function VendedoresPage() {
  const [ofertas, setOfertas] = useState<OfertaVenta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);

  // filtros
  const [search, setSearch]       = useState('');
  const [tipo, setTipo]           = useState('');
  const [ciudad, setCiudad]       = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [soloFlete, setSoloFlete] = useState(false);
  const [orden, setOrden]         = useState<OrdenKey>('reciente');
  const [showFiltros, setShowFiltros] = useState(false);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  // modales
  const [modalSolicitud, setModalSolicitud] = useState(false);
  const [formData, setFormData]  = useState<CreateSolicitudData>(SOLICITUD_INICIAL);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [modalInteres, setModalInteres] = useState(false);
  const [ofertaSel, setOfertaSel]       = useState<OfertaVenta | null>(null);
  const [cantNeg, setCantNeg]   = useState(0);
  const [precioNeg, setPrecioNeg] = useState(0);
  const [notasC, setNotasC]     = useState('');
  const [submNeg, setSubmNeg]   = useState(false);
  const [errNeg, setErrNeg]     = useState<string | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try { setLoading(true); setError(null); setOfertas(await getOfertas()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  const filtradas = useMemo(() => {
    const q = search.toLowerCase();
    const maxP = precioMax ? Number(precioMax) : null;
    return ordenar(
      ofertas.filter(o =>
        (!q || [o.ciudad, o.pais, o.vendedor.name, o.tipoProducto, o.descripcion ?? ''].some(s => s.toLowerCase().includes(q))) &&
        (!tipo || o.tipoProducto === tipo) &&
        (!ciudad || o.ciudad.toLowerCase().includes(ciudad.toLowerCase())) &&
        (!maxP || +o.precioUnitario <= maxP) &&
        (!soloFlete || o.incluyeFlete)
      ), orden
    );
  }, [ofertas, search, tipo, ciudad, precioMax, soloFlete, orden]);

  // reset de página cuando cambian filtros
  useEffect(() => { setPage(1); }, [search, tipo, ciudad, precioMax, soloFlete, orden]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pagina     = filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const ciudadesU  = useMemo(() => [...new Set(ofertas.map(o => o.ciudad))].sort(), [ofertas]);
  const hayFiltros = !!(search || tipo || ciudad || precioMax || soloFlete);

  function limpiar() {
    setSearch(''); setTipo(''); setCiudad(''); setPrecioMax(''); setSoloFlete(false); setOrden('reciente');
  }

  function abrirInteres(o: OfertaVenta) {
    setOfertaSel(o); setCantNeg(o.cantidad); setPrecioNeg(+o.precioUnitario);
    setNotasC(''); setErrNeg(null); setModalInteres(true);
  }

  async function confirmarInteres() {
    if (!ofertaSel) return;
    const compradorId = getCurrentUserId();
    if (!compradorId) { setErrNeg('No hay sesión activa.'); return; }
    setSubmNeg(true); setErrNeg(null);
    try {
      await createNegociacion({
        vendedorId: ofertaSel.vendedorId, compradorId, ofertaId: ofertaSel.id,
        tipoProducto: ofertaSel.tipoProducto, cantidad: cantNeg, precioUnitario: precioNeg,
        incluyeFlete: ofertaSel.incluyeFlete, costoFlete: 0,
        direccionEntrega: ofertaSel.ubicacion, ciudad: ofertaSel.ciudad, pais: ofertaSel.pais,
        notasComprador: notasC,
      });
      setSuccessMsg('¡Propuesta enviada! El vendedor recibirá tu solicitud.');
      setModalInteres(false); setOfertaSel(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) { setErrNeg(e.message || 'Error'); }
    finally { setSubmNeg(false); }
  }

  function chgForm(e: React.ChangeEvent<any>) {
    const { name, value, type } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'number' ? Number(value) : value }));
  }

  async function submitSolicitud(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try {
      await createSolicitud({ ...formData, fechaExpiracion: formData.fechaExpiracion || undefined, descripcion: formData.descripcion || undefined });
      setSuccessMsg('¡Solicitud publicada!'); setFormData(SOLICITUD_INICIAL); setModalSolicitud(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) { setFormError(e.message || 'Error'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">

      {/* Toast */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2">
          ✅ {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
          <p className="text-gray-500 mt-1">Ofertas de combustible disponibles para negociar</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} title="Actualizar"
            className="p-2.5 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setModalSolicitud(true)}
            className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
            <Plus className="w-4 h-4" />Publicar mi Solicitud
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Total Ofertas',  v: ofertas.length,                                    icon: Package,    c: 'bg-blue-50 text-blue-600'   },
          { l: 'Activas',        v: ofertas.filter(o => o.estado === 'ACTIVA').length,  icon: TrendingUp, c: 'bg-green-50 text-green-600'  },
          { l: 'Vendedores',     v: new Set(ofertas.map(o => o.vendedorId)).size,       icon: Users,      c: 'bg-purple-50 text-purple-600' },
        ].map(({ l, v, icon: Icon, c }) => (
          <Card key={l} className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-500 mb-1">{l}</p><p className="text-2xl font-bold text-gray-900">{v}</p></div>
                <div className={`p-2.5 rounded-xl ${c.split(' ')[0]}`}>
                  <Icon className={`w-5 h-5 ${c.split(' ')[1]}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Buscar por ciudad, vendedor, tipo..." value={search}
                onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
            </div>
            <div className="relative">
              <select value={tipo} onChange={e => setTipo(e.target.value)}
                className="h-10 pl-3 pr-8 border border-gray-200 rounded-md text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Todos los tipos</option>
                {Object.entries(TIPO_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select value={orden} onChange={e => setOrden(e.target.value as OrdenKey)}
                className="h-10 pl-8 pr-8 border border-gray-200 rounded-md text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500">
                {ORDEN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <Button variant="outline" onClick={() => setShowFiltros(!showFiltros)}
              className={`gap-2 h-10 ${showFiltros ? 'border-red-300 bg-red-50 text-red-600' : ''}`}>
              <SlidersHorizontal className="w-4 h-4" />
              {hayFiltros && <span className="w-2 h-2 bg-red-500 rounded-full" />}
            </Button>
          </div>

          {showFiltros && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 animate-in slide-in-from-top-1 duration-150">
              <div className="relative">
                <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input list="ciu-v" value={ciudad} onChange={e => setCiudad(e.target.value)}
                  placeholder="Ciudad..." className="h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-36" />
                <datalist id="ciu-v">{ciudadesU.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">$</span>
                <input type="number" min={0} value={precioMax} onChange={e => setPrecioMax(e.target.value)}
                  placeholder="Precio máx/gal" className="h-9 pl-6 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-36" />
              </div>
              <label className="flex items-center gap-2 h-9 px-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 text-sm">
                <input type="checkbox" checked={soloFlete} onChange={e => setSoloFlete(e.target.checked)}
                  className="w-4 h-4 rounded text-red-500" />
                Solo con flete
              </label>
              {hayFiltros && (
                <button onClick={limpiar} className="h-9 px-3 text-sm text-red-500 font-medium underline">
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          <div className="flex justify-between text-xs text-gray-400">
            <span>{filtradas.length} de {ofertas.length} ofertas{hayFiltros && ' (filtradas)'}</span>
            <span>Página {page} de {totalPages}</span>
          </div>
        </CardContent>
      </Card>

      {/* Lista con paginación */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Fuel className="w-5 h-5 text-red-500" />Ofertas disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 animate-spin text-red-500" />
              <span className="ml-3 text-gray-500">Cargando...</span>
            </div>
          )}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-500 mb-3">{error}</p>
              <Button variant="outline" onClick={cargar}>Reintentar</Button>
            </div>
          )}
          {!loading && !error && filtradas.length === 0 && (
            <div className="text-center py-16">
              <Fuel className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {hayFiltros ? 'Sin resultados con esos filtros' : 'No hay ofertas disponibles'}
              </p>
              {hayFiltros && <button onClick={limpiar} className="mt-2 text-sm text-red-500 underline">Limpiar filtros</button>}
            </div>
          )}

          {!loading && !error && pagina.length > 0 && (
            <>
              <div className="space-y-3">
                {pagina.map(o => {
                  const t = TIPO_COLORS[o.tipoProducto] ?? { bg: 'bg-gray-50', text: 'text-gray-700', label: o.tipoProducto };
                  return (
                    <div key={o.id}
                      className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md bg-white transition-all">
                      <div className={`p-3 rounded-xl ${t.bg} flex-shrink-0 self-start`}>
                        <Fuel className={`w-6 h-6 ${t.text}`} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${t.bg} ${t.text}`}>{t.label}</span>
                          {o.incluyeFlete && <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-600 uppercase">Flete incluido</span>}
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${o.estado === 'ACTIVA' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{o.estado}</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl font-bold text-red-600">
                            ${Number(o.precioUnitario).toFixed(2)}
                            <span className="text-xs font-normal text-gray-400 ml-1">/gal</span>
                          </span>
                          <span className="text-base font-semibold text-gray-700">{o.cantidad.toLocaleString()} gal</span>
                          <span className="text-xs text-gray-400">Total: <span className="font-semibold text-gray-600">${(o.cantidad * +o.precioUnitario).toLocaleString()}</span></span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{o.ciudad}, {o.pais}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(o.fechaDisponible).toLocaleDateString('es-CO')}</span>
                        </div>
                        {o.descripcion && <p className="text-xs text-gray-400 line-clamp-1">{o.descripcion}</p>}
                      </div>
                      <div className="flex flex-col justify-between gap-2 min-w-[120px]">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">Vendedor</p>
                          <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">{o.vendedor.name}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(o.createdAt).toLocaleDateString('es-CO')}</p>
                        </div>
                        <Button size="sm" onClick={() => abrirInteres(o)}
                          className="bg-red-500 hover:bg-red-600 text-white h-9 text-xs">
                          Me interesa →
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pager cur={page} tot={totalPages} total={filtradas.length} pageSize={PAGE_SIZE} onPage={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* MODAL Publicar Solicitud */}
      {modalSolicitud && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl"><Package className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Nueva Solicitud</h2>
                  <p className="text-xs text-gray-400">Publica tu necesidad de combustible</p>
                </div>
              </div>
              <button onClick={() => { setModalSolicitud(false); setFormError(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="overflow-y-auto max-h-[calc(88vh-160px)] px-6 py-5">
              <form onSubmit={submitSolicitud} className="space-y-4">
                {formError && <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">{formError}</div>}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Combustible</label>
                    <div className="relative">
                      <select name="tipoProducto" value={formData.tipoProducto} onChange={chgForm} required
                        className="w-full h-11 pl-3 pr-8 bg-gray-50 border-0 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-red-500 focus:bg-white">
                        {Object.entries(TIPO_COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Cantidad (gal)</label>
                    <input type="number" name="cantidadRequerida" min={1} value={formData.cantidadRequerida || ''} onChange={chgForm}
                      placeholder="5000" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Precio máx/gal ($)</label>
                    <input type="number" name="precioMaximo" min={0} step="0.01" value={formData.precioMaximo || ''} onChange={chgForm}
                      placeholder="2.80" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" />
                  </div>
                </div>
                {formData.cantidadRequerida > 0 && formData.precioMaximo > 0 && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Presupuesto máximo total</span>
                    <span className="text-xl font-bold text-red-600">
                      ${(formData.cantidadRequerida * formData.precioMaximo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Dirección entrega</label><input type="text" name="direccionEntrega" value={formData.direccionEntrega} onChange={chgForm} placeholder="Carrera 10 #25-30" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Ciudad</label><input type="text" name="ciudad" value={formData.ciudad} onChange={chgForm} placeholder="Bogotá" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">País</label><input type="text" name="pais" value={formData.pais} onChange={chgForm} placeholder="Colombia" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Fecha requerida</label><input type="date" name="fechaRequerida" value={formData.fechaRequerida} onChange={chgForm} required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Expiración <span className="text-gray-400 normal-case font-normal">(opc.)</span></label><input type="date" name="fechaExpiracion" value={formData.fechaExpiracion} onChange={chgForm} className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Descripción <span className="text-gray-400 normal-case font-normal">(opc.)</span></label><textarea name="descripcion" value={formData.descripcion} onChange={chgForm} rows={2} placeholder="Especificaciones del producto..." className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white resize-none" /></div>
              </form>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setModalSolicitud(false); setFormError(null); }} disabled={submitting}
                className="flex-1 h-11 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button disabled={submitting} onClick={() => document.querySelector('form')?.requestSubmit()}
                className="flex-1 h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</> : 'Publicar Solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Me Interesa */}
      {modalInteres && ofertaSel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-xl"><Fuel className="w-5 h-5 text-green-600" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Enviar propuesta</h2>
                  <p className="text-xs text-gray-400">Confirma los detalles de tu pedido</p>
                </div>
              </div>
              <button onClick={() => { setModalInteres(false); setErrNeg(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="overflow-y-auto max-h-[calc(88vh-160px)] px-6 py-5 space-y-4">
              {errNeg && <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">{errNeg}</div>}
              <div className="p-4 bg-gray-50 rounded-xl text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Oferta seleccionada</p>
                <div className="grid grid-cols-2 gap-2">
                  {[['Vendedor', ofertaSel.vendedor.name], ['Tipo', ofertaSel.tipoProducto], ['Disponible', `${ofertaSel.cantidad.toLocaleString()} gal`], ['Precio', `$${+ofertaSel.precioUnitario}/gal`], ['Ciudad', `${ofertaSel.ciudad}, ${ofertaSel.pais}`], ['Flete', ofertaSel.incluyeFlete ? 'Incluido' : 'No']].map(([l, v]) => (
                    <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-semibold text-gray-800">{v}</p></div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Cantidad (gal)</label>
                  <input type="number" min={1} max={ofertaSel.cantidad} value={cantNeg} onChange={e => setCantNeg(+e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:bg-white" />
                  <p className="text-[10px] text-gray-400 mt-1">Máx: {ofertaSel.cantidad.toLocaleString()} gal</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Tu precio/gal ($)</label>
                  <input type="number" min={0} step="0.01" value={precioNeg} onChange={e => setPrecioNeg(+e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:bg-white" />
                  <p className="text-[10px] text-gray-400 mt-1">Precio oferta: ${+ofertaSel.precioUnitario}</p>
                </div>
              </div>
              {cantNeg > 0 && precioNeg > 0 && (
                <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Total propuesta</span>
                  <span className="text-xl font-bold text-green-600">${(cantNeg * precioNeg).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Notas <span className="text-gray-400 normal-case font-normal">(opc.)</span></label>
                <textarea value={notasC} onChange={e => setNotasC(e.target.value)} rows={2}
                  placeholder="Horario de entrega, especificaciones..."
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:bg-white resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setModalInteres(false); setErrNeg(null); }} disabled={submNeg}
                className="flex-1 h-11 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmarInteres} disabled={submNeg || cantNeg <= 0 || precioNeg <= 0}
                className="flex-1 h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submNeg ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : 'Confirmar interés'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}