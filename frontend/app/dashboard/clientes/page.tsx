'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Fuel, MapPin, Calendar, TrendingUp, Package,
  X, Loader2, ChevronDown, ArrowUpDown, SlidersHorizontal,
  ShoppingCart, ChevronLeft, ChevronRight, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserId } from '@/lib/get-current-user-id';
import { createNegociacion } from '@/services/negociaciones.service';
import { getSolicitudes, type SolicitudCompra } from '@/services/solicitudes.service';
import { createOferta, type CreateOfertaData } from '@/services/ofertas.service';

// ── constantes ─────────────────────────────────────────────────────────────────
const TIPO_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DIESEL:             { bg: 'bg-yellow-50', text: 'text-yellow-700', label: 'Diesel'    },
  GASOLINA_CORRIENTE: { bg: 'bg-blue-50',   text: 'text-blue-700',   label: 'Corriente' },
  GASOLINA_EXTRA:     { bg: 'bg-green-50',  text: 'text-green-700',  label: 'Extra'     },
  JET_FUEL:           { bg: 'bg-purple-50', text: 'text-purple-700', label: 'Jet Fuel'  },
  GLP:                { bg: 'bg-orange-50', text: 'text-orange-700', label: 'GLP'       },
};

const OFERTA_INICIAL: CreateOfertaData = {
  tipoProducto: 'DIESEL', cantidad: 0, precioUnitario: 0,
  ubicacion: '', pais: '', ciudad: '', fechaDisponible: '',
  fechaExpiracion: '', descripcion: '', incluyeFlete: false, radioEntrega: 0,
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

function ordenar(list: SolicitudCompra[], o: OrdenKey) {
  return [...list].sort((a, b) => {
    switch (o) {
      case 'reciente':      return +new Date(b.createdAt) - +new Date(a.createdAt);
      case 'antiguo':       return +new Date(a.createdAt) - +new Date(b.createdAt);
      case 'precio-asc':    return +a.precioMaximo - +b.precioMaximo;
      case 'precio-desc':   return +b.precioMaximo - +a.precioMaximo;
      case 'cantidad-desc': return b.cantidadRequerida - a.cantidadRequerida;
      case 'cantidad-asc':  return a.cantidadRequerida - b.cantidadRequerida;
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
        <span className="font-semibold text-gray-600">{total}</span> solicitudes
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPage(cur - 1)} disabled={cur === 1}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) => p === '...'
          ? <span key={`d${i}`} className="w-8 text-center text-gray-400 text-sm">…</span>
          : <button key={p} onClick={() => onPage(p as number)}
              className={`h-8 w-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${p === cur ? 'bg-red-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>{p}</button>
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
export default function ClientesPage() {
  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [page, setPage]               = useState(1);

  // filtros
  const [search, setSearch]       = useState('');
  const [tipo, setTipo]           = useState('');
  const [ciudad, setCiudad]       = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [orden, setOrden]         = useState<OrdenKey>('reciente');
  const [showFiltros, setShowFiltros] = useState(false);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  // modal publicar oferta
  const [modalOferta, setModalOferta] = useState(false);
  const [formData, setFormData]   = useState<CreateOfertaData>(OFERTA_INICIAL);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);

  // modal contactar
  const [modalContactar, setModalContactar]   = useState(false);
  const [solSel, setSolSel]                   = useState<SolicitudCompra | null>(null);
  const [cantOfrecer, setCantOfrecer]         = useState(0);
  const [precioOfrecer, setPrecioOfrecer]     = useState(0);
  const [notasV, setNotasV]                   = useState('');
  const [submNeg, setSubmNeg]                 = useState(false);
  const [errNeg, setErrNeg]                   = useState<string | null>(null);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    try { setLoading(true); setError(null); setSolicitudes(await getSolicitudes()); }
    catch (e: any) { setError(e.message || 'Error al cargar'); }
    finally { setLoading(false); }
  }

  const filtradas = useMemo(() => {
    const q = search.toLowerCase();
    const minP = precioMin ? Number(precioMin) : null;
    return ordenar(
      solicitudes.filter(s =>
        (!q || [s.ciudad, s.pais, s.comprador.name, s.tipoProducto, s.descripcion ?? '', s.direccionEntrega ?? ''].some(x => x.toLowerCase().includes(q))) &&
        (!tipo   || s.tipoProducto === tipo) &&
        (!ciudad || s.ciudad.toLowerCase().includes(ciudad.toLowerCase())) &&
        (!minP   || +s.precioMaximo >= minP)
      ), orden
    );
  }, [solicitudes, search, tipo, ciudad, precioMin, orden]);

  useEffect(() => { setPage(1); }, [search, tipo, ciudad, precioMin, orden]);

  const totalPages = Math.max(1, Math.ceil(filtradas.length / PAGE_SIZE));
  const pagina     = filtradas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const ciudadesU  = useMemo(() => [...new Set(solicitudes.map(s => s.ciudad))].sort(), [solicitudes]);
  const hayFiltros = !!(search || tipo || ciudad || precioMin);

  function limpiar() { setSearch(''); setTipo(''); setCiudad(''); setPrecioMin(''); setOrden('reciente'); }

  function abrirContactar(s: SolicitudCompra) {
    setSolSel(s); setCantOfrecer(s.cantidadRequerida); setPrecioOfrecer(+s.precioMaximo);
    setNotasV(''); setErrNeg(null); setModalContactar(true);
  }

  async function confirmarContacto() {
    if (!solSel) return;
    const vendedorId = getCurrentUserId();
    if (!vendedorId) { setErrNeg('No hay sesión activa.'); return; }
    setSubmNeg(true); setErrNeg(null);
    try {
      await createNegociacion({
        vendedorId, compradorId: solSel.compradorId, solicitudId: solSel.id,
        tipoProducto: solSel.tipoProducto, cantidad: cantOfrecer, precioUnitario: precioOfrecer,
        incluyeFlete: false, direccionEntrega: solSel.direccionEntrega,
        ciudad: solSel.ciudad, pais: solSel.pais, notasComprador: notasV,
      });
      setSuccessMsg('¡Propuesta enviada! El comprador recibirá tu oferta.');
      setModalContactar(false); setSolSel(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) { setErrNeg(e.message || 'Error'); }
    finally { setSubmNeg(false); }
  }

  function chgForm(e: React.ChangeEvent<any>) {
    const { name, value, type } = e.target;
    setFormData(p => ({
      ...p,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
             : type === 'number'  ? Number(value)
             : value,
    }));
  }

  async function submitOferta(e: React.FormEvent) {
    e.preventDefault(); setSubmitting(true); setFormError(null);
    try {
      await createOferta({ ...formData, fechaExpiracion: formData.fechaExpiracion || undefined, descripcion: formData.descripcion || undefined, radioEntrega: formData.radioEntrega || undefined });
      setSuccessMsg('¡Oferta publicada!'); setFormData(OFERTA_INICIAL); setModalOferta(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (e: any) { setFormError(e.message || 'Error'); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium animate-in slide-in-from-top-2 flex items-center gap-2">
          ✅ {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 mt-1">Solicitudes de combustible publicadas por compradores</p>
        </div>
        <div className="flex gap-2">
          <button onClick={cargar} title="Actualizar"
            className="p-2.5 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setModalOferta(true)}
            className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
            <Plus className="w-4 h-4" />Publicar mi Oferta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { l: 'Total Solicitudes',   v: solicitudes.length,                                      icon: ShoppingCart, c: 'bg-blue-50 text-blue-600'   },
          { l: 'Activas',             v: solicitudes.filter(s => s.estado === 'ACTIVA').length,    icon: TrendingUp,   c: 'bg-green-50 text-green-600'  },
          { l: 'Compradores',         v: new Set(solicitudes.map(s => s.compradorId)).size,        icon: Package,      c: 'bg-purple-50 text-purple-600' },
        ].map(({ l, v, icon: Icon, c }) => (
          <Card key={l} className="border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div><p className="text-xs text-gray-500 mb-1">{l}</p><p className="text-2xl font-bold text-gray-900">{v}</p></div>
                <div className={`p-2.5 rounded-xl ${c.split(' ')[0]}`}><Icon className={`w-5 h-5 ${c.split(' ')[1]}`} /></div>
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
              <Input placeholder="Buscar por ciudad, comprador, tipo..." value={search}
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
                <input list="ciu-c" value={ciudad} onChange={e => setCiudad(e.target.value)}
                  placeholder="Ciudad..." className="h-9 pl-8 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-36" />
                <datalist id="ciu-c">{ciudadesU.map(c => <option key={c} value={c} />)}</datalist>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">$</span>
                <input type="number" min={0} value={precioMin} onChange={e => setPrecioMin(e.target.value)}
                  placeholder="Paga mínimo" className="h-9 pl-6 pr-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 w-36" />
              </div>
              {hayFiltros && <button onClick={limpiar} className="h-9 px-3 text-sm text-red-500 font-medium underline">Limpiar filtros</button>}
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400">
            <span>{filtradas.length} de {solicitudes.length} solicitudes{hayFiltros && ' (filtradas)'}</span>
            <span>Página {page} de {totalPages}</span>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="w-5 h-5 text-red-500" />Solicitudes de compradores
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
              <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{hayFiltros ? 'Sin resultados con esos filtros' : 'No hay solicitudes disponibles'}</p>
              {hayFiltros && <button onClick={limpiar} className="mt-2 text-sm text-red-500 underline">Limpiar filtros</button>}
            </div>
          )}
          {!loading && !error && pagina.length > 0 && (
            <>
              <div className="space-y-3">
                {pagina.map(s => {
                  const t = TIPO_COLORS[s.tipoProducto] ?? { bg: 'bg-gray-50', text: 'text-gray-700', label: s.tipoProducto };
                  const presupuesto = s.cantidadRequerida * +s.precioMaximo;
                  return (
                    <div key={s.id}
                      className="flex flex-col md:flex-row gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md bg-white transition-all">
                      <div className={`p-3 rounded-xl ${t.bg} flex-shrink-0 self-start`}>
                        <ShoppingCart className={`w-6 h-6 ${t.text}`} />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${t.bg} ${t.text}`}>{t.label}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${s.estado === 'ACTIVA' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{s.estado}</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span className="text-xl font-bold text-green-600">
                            ${Number(s.precioMaximo).toFixed(2)}
                            <span className="text-xs font-normal text-gray-400 ml-1">/gal máx</span>
                          </span>
                          <span className="text-base font-semibold text-gray-700">{s.cantidadRequerida.toLocaleString()} gal</span>
                          <span className="text-xs text-gray-400">Presupuesto: <span className="font-semibold text-gray-600">${presupuesto.toLocaleString()}</span></span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.ciudad}, {s.pais}</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Necesita: {new Date(s.fechaRequerida).toLocaleDateString('es-CO')}</span>
                        </div>
                        {s.descripcion && <p className="text-xs text-gray-400 line-clamp-1">{s.descripcion}</p>}
                        {s.direccionEntrega && <p className="text-xs text-gray-400">Entrega: {s.direccionEntrega}</p>}
                      </div>
                      <div className="flex flex-col justify-between gap-2 min-w-[120px]">
                        <div className="text-right">
                          <p className="text-[10px] text-gray-400">Comprador</p>
                          <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">{s.comprador.name}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(s.createdAt).toLocaleDateString('es-CO')}</p>
                        </div>
                        <Button size="sm" onClick={() => abrirContactar(s)}
                          className="bg-red-500 hover:bg-red-600 text-white h-9 text-xs">
                          Contactar →
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

      {/* MODAL Publicar Oferta */}
      {modalOferta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl"><Fuel className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Nueva Oferta</h2>
                  <p className="text-xs text-gray-400">Publica tu disponibilidad de combustible</p>
                </div>
              </div>
              <button onClick={() => { setModalOferta(false); setFormError(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="overflow-y-auto max-h-[calc(88vh-160px)] px-6 py-5">
              <form onSubmit={submitOferta} className="space-y-4">
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
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Cantidad (gal)</label><input type="number" name="cantidad" min={1} value={formData.cantidad || ''} onChange={chgForm} placeholder="5000" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Precio/gal ($)</label><input type="number" name="precioUnitario" min={0} step="0.01" value={formData.precioUnitario || ''} onChange={chgForm} placeholder="2.50" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                </div>
                {formData.cantidad > 0 && formData.precioUnitario > 0 && (
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500">Valor total de la oferta</span>
                    <span className="text-xl font-bold text-red-600">${(formData.cantidad * formData.precioUnitario).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Terminal/Ubicación</label><input type="text" name="ubicacion" value={formData.ubicacion} onChange={chgForm} placeholder="Terminal Los Pinos" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Ciudad</label><input type="text" name="ciudad" value={formData.ciudad} onChange={chgForm} placeholder="Bogotá" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">País</label><input type="text" name="pais" value={formData.pais} onChange={chgForm} placeholder="Colombia" required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Disponible desde</label><input type="date" name="fechaDisponible" value={formData.fechaDisponible} onChange={chgForm} required className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Válida hasta <span className="text-gray-400 normal-case font-normal">(opc.)</span></label><input type="date" name="fechaExpiracion" value={formData.fechaExpiracion} onChange={chgForm} className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" /></div>
                </div>
                <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Descripción <span className="text-gray-400 normal-case font-normal">(opc.)</span></label><textarea name="descripcion" value={formData.descripcion} onChange={chgForm} rows={2} placeholder="Certificaciones, calidad del producto..." className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white resize-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <input type="checkbox" name="incluyeFlete" checked={formData.incluyeFlete} onChange={chgForm} className="w-4 h-4 rounded text-red-500" />
                    <div><p className="text-sm font-semibold text-gray-800">Incluye transporte</p><p className="text-xs text-gray-400">Ofrezco envío dentro de cierto radio</p></div>
                  </label>
                  <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Radio (km) <span className="text-gray-400 normal-case font-normal">(opc.)</span></label><input type="number" name="radioEntrega" min={0} value={formData.radioEntrega || ''} onChange={chgForm} placeholder="50" disabled={!formData.incluyeFlete} className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white disabled:opacity-40 disabled:cursor-not-allowed" /></div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setModalOferta(false); setFormError(null); }} disabled={submitting}
                className="flex-1 h-11 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button disabled={submitting} onClick={() => document.querySelector('form')?.requestSubmit()}
                className="flex-1 h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</> : 'Publicar Oferta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL Contactar */}
      {modalContactar && solSel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl"><Fuel className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Enviar propuesta</h2>
                  <p className="text-xs text-gray-400">Parametriza tu oferta para este cliente</p>
                </div>
              </div>
              <button onClick={() => { setModalContactar(false); setErrNeg(null); }} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="overflow-y-auto max-h-[calc(88vh-160px)] px-6 py-5 space-y-4">
              {errNeg && <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">{errNeg}</div>}
              <div className="p-4 bg-gray-50 rounded-xl text-sm">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Solicitud seleccionada</p>
                <div className="grid grid-cols-2 gap-2">
                  {[['Comprador', solSel.comprador.name], ['Tipo', solSel.tipoProducto], ['Cantidad requerida', `${solSel.cantidadRequerida.toLocaleString()} gal`], ['Paga máx', `$${+solSel.precioMaximo}/gal`], ['Entrega', `${solSel.ciudad}, ${solSel.pais}`], ['Lo necesita', new Date(solSel.fechaRequerida).toLocaleDateString('es-CO')]].map(([l, v]) => (
                    <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="font-semibold text-gray-800">{v}</p></div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Cantidad a ofrecer (gal)</label>
                  <input type="number" min={1} value={cantOfrecer} onChange={e => setCantOfrecer(+e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" />
                  <p className="text-[10px] text-gray-400 mt-1">Solicitado: {solSel.cantidadRequerida.toLocaleString()} gal</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Tu precio/gal ($)</label>
                  <input type="number" min={0} step="0.01" value={precioOfrecer} onChange={e => setPrecioOfrecer(+e.target.value)}
                    className="w-full h-11 px-3 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white" />
                  <p className={`text-[10px] mt-1 ${precioOfrecer > +solSel.precioMaximo ? 'text-orange-500' : 'text-green-500'}`}>
                    {precioOfrecer > +solSel.precioMaximo ? '⚠ Supera el precio máximo del cliente' : '✓ Dentro del presupuesto'}
                  </p>
                </div>
              </div>
              {cantOfrecer > 0 && precioOfrecer > 0 && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Valor total propuesta</span>
                  <span className="text-xl font-bold text-red-600">${(cantOfrecer * precioOfrecer).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Notas para el comprador <span className="text-gray-400 normal-case font-normal">(opc.)</span></label>
                <textarea value={notasV} onChange={e => setNotasV(e.target.value)} rows={2}
                  placeholder="Disponibilidad inmediata, certificaciones..."
                  className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:bg-white resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
              <button onClick={() => { setModalContactar(false); setErrNeg(null); }} disabled={submNeg}
                className="flex-1 h-11 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50">
                Cancelar
              </button>
              <button onClick={confirmarContacto} disabled={submNeg || cantOfrecer <= 0 || precioOfrecer <= 0}
                className="flex-1 h-11 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {submNeg ? <><Loader2 className="w-4 h-4 animate-spin" />Enviando...</> : 'Enviar Propuesta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}