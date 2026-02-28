'use client';

import { useState, useEffect } from 'react';
import {
  Search, Plus, Download, Fuel, MapPin,
  Calendar, TrendingUp, Package, X,
  Loader2, ChevronDown, ShoppingCart,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserId } from '@/lib/get-current-user-id';                         // ← CAMBIO
import { createNegociacion } from '@/services/negociaciones.service';
import { getSolicitudes, type SolicitudCompra } from '@/services/solicitudes.service';
import { createOferta, type CreateOfertaData } from '@/services/ofertas.service';

const TIPO_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DIESEL:             { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Diesel' },
  GASOLINA_CORRIENTE: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Corriente' },
  GASOLINA_EXTRA:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Extra' },
  JET_FUEL:           { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Jet Fuel' },
  GLP:                { bg: 'bg-orange-100', text: 'text-orange-700', label: 'GLP' },
};

const OFERTA_INICIAL: CreateOfertaData = {
  tipoProducto: 'DIESEL',
  cantidad: 0,
  precioUnitario: 0,
  ubicacion: '',
  pais: '',
  ciudad: '',
  fechaDisponible: '',
  fechaExpiracion: '',
  descripcion: '',
  incluyeFlete: false,
  radioEntrega: 0,
};

export default function ClientesPage() {


  const [solicitudes, setSolicitudes]   = useState<SolicitudCompra[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filtroTipo, setFiltroTipo]     = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [formData, setFormData]         = useState<CreateOfertaData>(OFERTA_INICIAL);
  const [submitting, setSubmitting]     = useState(false);
  const [formError, setFormError]       = useState<string | null>(null);
  const [successMsg, setSuccessMsg]     = useState<string | null>(null);

  const [modalContactarOpen, setModalContactarOpen]   = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<SolicitudCompra | null>(null);
  const [cantidadOfrecer, setCantidadOfrecer]         = useState(0);
  const [precioOfrecer, setPrecioOfrecer]             = useState(0);
  const [notasVendedor, setNotasVendedor]             = useState('');
  const [submittingNegociacion, setSubmittingNegociacion] = useState(false);
  const [errorNegociacion, setErrorNegociacion]       = useState<string | null>(null);

  useEffect(() => { cargarSolicitudes(); }, []);

  async function cargarSolicitudes() {
    try {
      setLoading(true);
      setError(null);
      const data = await getSolicitudes();
      setSolicitudes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }

  const solicitudesFiltradas = solicitudes.filter((s) => {
    const coincideBusqueda =
      s.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.comprador.name.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideTipo = filtroTipo ? s.tipoProducto === filtroTipo : true;
    return coincideBusqueda && coincideTipo;
  });

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number' ? Number(value) : value,
    }));
  }

  function handleContactar(solicitud: SolicitudCompra) {
    setSolicitudSeleccionada(solicitud);
    setCantidadOfrecer(solicitud.cantidadRequerida);
    setPrecioOfrecer(Number(solicitud.precioMaximo));
    setNotasVendedor('');
    setErrorNegociacion(null);
    setModalContactarOpen(true);
  }

  // ── CORREGIDO: usa user del hook ─────────────────────────────────────────────
  async function handleConfirmarContacto() {
    if (!solicitudSeleccionada) return;

    const vendedorId = getCurrentUserId();
    if (!vendedorId) {
      setErrorNegociacion('No hay sesión activa. Por favor inicia sesión nuevamente.');
      return;
    }

    setSubmittingNegociacion(true);
    setErrorNegociacion(null);

    try {
      await createNegociacion({
        vendedorId,
        compradorId: solicitudSeleccionada.compradorId,
        solicitudId: solicitudSeleccionada.id,
        tipoProducto: solicitudSeleccionada.tipoProducto,
        cantidad: cantidadOfrecer,
        precioUnitario: precioOfrecer,
        incluyeFlete: false,
        direccionEntrega: solicitudSeleccionada.direccionEntrega,
        ciudad: solicitudSeleccionada.ciudad,
        pais: solicitudSeleccionada.pais,
        notasComprador: notasVendedor,
      });
      setSuccessMsg('¡Propuesta enviada! El comprador recibirá tu oferta.');
      setModalContactarOpen(false);
      setSolicitudSeleccionada(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorNegociacion(err.message || 'Error al contactar');
    } finally {
      setSubmittingNegociacion(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await createOferta({
        ...formData,
        fechaExpiracion: formData.fechaExpiracion || undefined,
        descripcion:     formData.descripcion     || undefined,
        radioEntrega:    formData.radioEntrega     || undefined,
      });
      setSuccessMsg('¡Tu oferta fue publicada! Los compradores ya pueden verla.');
      setFormData(OFERTA_INICIAL);
      setModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Error al publicar la oferta');
    } finally {
      setSubmitting(false);
    }
  }

  const totalSolicitudes   = solicitudes.length;
  const solicitudesActivas = solicitudes.filter((s) => s.estado === 'ACTIVA').length;
  const compradoresUnicos  = new Set(solicitudes.map((s) => s.compradorId)).size;

  return (
    <div className="space-y-6">

      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-2">
          ✅ {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-600 mt-1">Solicitudes de combustible publicadas por compradores</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
          <Plus className="w-4 h-4" />
          Publicar mi Oferta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Solicitudes', value: totalSolicitudes, icon: ShoppingCart, color: 'bg-blue-50 text-blue-600' },
          { label: 'Solicitudes Activas', value: solicitudesActivas, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Compradores Activos', value: compradoresUnicos, icon: Package, color: 'bg-purple-50 text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{label}</p>
                  <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${color.split(' ')[0]}`}>
                  <Icon className={`w-6 h-6 ${color.split(' ')[1]}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input type="search" placeholder="Buscar por ciudad, país o comprador..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <div className="relative">
              <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}
                className="h-10 pl-3 pr-8 border border-gray-200 rounded-md text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500">
                <option value="">Todos los tipos</option>
                <option value="DIESEL">Diesel</option>
                <option value="GASOLINA_CORRIENTE">Corriente</option>
                <option value="GASOLINA_EXTRA">Extra</option>
                <option value="JET_FUEL">Jet Fuel</option>
                <option value="GLP">GLP</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <Button variant="outline" className="gap-2"><Download className="w-4 h-4" />Exportar</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-red-600" />Solicitudes de Compradores</CardTitle>
          <CardDescription>{solicitudesFiltradas.length} solicitudes encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-red-500" /><span className="ml-3 text-gray-600">Cargando solicitudes...</span></div>}
          {error && !loading && <div className="text-center py-12"><p className="text-red-500 mb-3">{error}</p><Button variant="outline" onClick={cargarSolicitudes}>Reintentar</Button></div>}
          {!loading && !error && solicitudesFiltradas.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay solicitudes disponibles</p>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {solicitudesFiltradas.map((solicitud) => {
                const tipo = TIPO_COLORS[solicitud.tipoProducto] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: solicitud.tipoProducto };
                return (
                  <div key={solicitud.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${tipo.bg} flex-shrink-0`}>
                          <ShoppingCart className={`w-6 h-6 ${tipo.text}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{solicitud.cantidadRequerida.toLocaleString()} galones requeridos</h3>
                            <Badge className={`${tipo.bg} ${tipo.text} border-0`}>{tipo.label}</Badge>
                          </div>
                          <p className="text-2xl font-bold text-green-600">
                            Paga hasta ${Number(solicitud.precioMaximo).toFixed(2)}
                            <span className="text-sm font-normal text-gray-500"> / galón</span>
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{solicitud.ciudad}, {solicitud.pais}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Necesita para: {new Date(solicitud.fechaRequerida).toLocaleDateString('es-CO')}</span>
                          </div>
                          {solicitud.descripcion && <p className="text-sm text-gray-500 mt-1">{solicitud.descripcion}</p>}
                          <p className="text-xs text-gray-400 mt-1">Entrega en: {solicitud.direccionEntrega}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-green-100 text-green-700 border-0">{solicitud.estado}</Badge>
                        <p className="text-sm text-gray-600">Comprador: <span className="font-semibold">{solicitud.comprador.name}</span></p>
                        <p className="text-xs text-gray-400">Presupuesto máx: ${(solicitud.cantidadRequerida * Number(solicitud.precioMaximo)).toLocaleString()}</p>
                        <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white mt-1" onClick={() => handleContactar(solicitud)}>
                          Contactar
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ MODAL — Publicar Oferta ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative px-6 pt-6 pb-4">
              <button onClick={() => { setModalOpen(false); setFormError(null); }} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-red-50 rounded-xl"><Fuel className="w-6 h-6 text-red-500" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Nueva Oferta</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Publica tu disponibilidad de combustible</p>
                </div>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              <form onSubmit={handleSubmit} className="space-y-6">
                {formError && (
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                    <span className="text-red-600 text-xs font-bold mt-0.5">!</span>
                    <p className="text-sm text-red-700 flex-1">{formError}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Combustible</label>
                      <div className="relative">
                        <select name="tipoProducto" value={formData.tipoProducto} onChange={handleFormChange} required
                          className="w-full h-12 pl-4 pr-10 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all appearance-none cursor-pointer">
                          <option value="DIESEL">Diesel</option>
                          <option value="GASOLINA_CORRIENTE">Corriente</option>
                          <option value="GASOLINA_EXTRA">Extra</option>
                          <option value="JET_FUEL">Jet Fuel</option>
                          <option value="GLP">GLP</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cantidad (gal)</label>
                      <input type="number" name="cantidad" min={1} value={formData.cantidad || ''} onChange={handleFormChange} placeholder="5,000" required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Precio/Gal ($)</label>
                      <input type="number" name="precioUnitario" min={0} step="0.01" value={formData.precioUnitario || ''} onChange={handleFormChange} placeholder="2.50" required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                  </div>
                  {formData.cantidad > 0 && formData.precioUnitario > 0 && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                      <p className="text-sm text-gray-600">Valor total de la oferta</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">${(formData.cantidad * formData.precioUnitario).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Terminal</label>
                      <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleFormChange} placeholder="Terminal Los Pinos" required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Ciudad</label>
                      <input type="text" name="ciudad" value={formData.ciudad} onChange={handleFormChange} placeholder="Bogotá" required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">País</label>
                      <input type="text" name="pais" value={formData.pais} onChange={handleFormChange} placeholder="Colombia" required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Disponible desde</label>
                      <input type="date" name="fechaDisponible" value={formData.fechaDisponible} onChange={handleFormChange} required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Válida hasta <span className="text-gray-400 normal-case">(opcional)</span></label>
                      <input type="date" name="fechaExpiracion" value={formData.fechaExpiracion} onChange={handleFormChange}
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Descripción <span className="text-gray-400 normal-case">(opcional)</span></label>
                    <textarea name="descripcion" value={formData.descripcion} onChange={handleFormChange} rows={3} placeholder="Certificaciones, calidad del producto, condiciones de entrega..."
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                      <input type="checkbox" name="incluyeFlete" checked={formData.incluyeFlete} onChange={handleFormChange}
                        className="w-5 h-5 rounded border-gray-300 text-red-500 focus:ring-red-500 focus:ring-offset-0" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">Incluye transporte</p>
                        <p className="text-xs text-gray-500">Ofrezco envío dentro de cierto radio</p>
                      </div>
                    </label>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Radio (km) <span className="text-gray-400 normal-case">(opcional)</span></label>
                      <input type="number" name="radioEntrega" min={0} value={formData.radioEntrega || ''} onChange={handleFormChange} placeholder="50" disabled={!formData.incluyeFlete}
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed" />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-3">
                <button type="button" onClick={() => { setModalOpen(false); setFormError(null); }} disabled={submitting}
                  className="flex-1 h-12 px-4 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancelar
                </button>
                <button type="button" disabled={submitting} onClick={() => { const form = document.querySelector('form'); form?.requestSubmit(); }}
                  className="flex-1 h-12 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Publicando...</span> : 'Publicar Oferta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL — Contactar ═══ */}
      {modalContactarOpen && solicitudSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative px-6 pt-6 pb-4">
              <button onClick={() => { setModalContactarOpen(false); setErrorNegociacion(null); }} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-red-50 rounded-xl"><Fuel className="w-6 h-6 text-red-500" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Enviar Propuesta</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Parametriza tu oferta para este cliente</p>
                </div>
              </div>
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
            <div className="overflow-y-auto px-6 py-6" style={{ maxHeight: 'calc(85vh - 180px)' }}>
              {errorNegociacion && (
                <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                  <span className="text-red-600 text-xs font-bold mt-0.5">!</span>
                  <p className="text-sm text-red-700 flex-1">{errorNegociacion}</p>
                </div>
              )}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Detalles de la Solicitud</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Comprador</p><p className="font-semibold text-gray-900">{solicitudSeleccionada.comprador.name}</p></div>
                  <div><p className="text-gray-500">Tipo Combustible</p><p className="font-semibold text-gray-900">{solicitudSeleccionada.tipoProducto}</p></div>
                  <div><p className="text-gray-500">Cantidad requerida</p><p className="font-semibold text-gray-900">{solicitudSeleccionada.cantidadRequerida.toLocaleString()} gal</p></div>
                  <div><p className="text-gray-500">Precio máximo</p><p className="font-semibold text-gray-900">${Number(solicitudSeleccionada.precioMaximo).toFixed(2)}/gal</p></div>
                  <div><p className="text-gray-500">Entrega en</p><p className="font-semibold text-gray-900">{solicitudSeleccionada.ciudad}, {solicitudSeleccionada.pais}</p></div>
                  <div><p className="text-gray-500">Lo necesita para</p><p className="font-semibold text-gray-900">{new Date(solicitudSeleccionada.fechaRequerida).toLocaleDateString('es-CO')}</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Tu propuesta</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cantidad que puedes ofrecer (gal)</label>
                    <input type="number" min={1} value={cantidadOfrecer} onChange={(e) => setCantidadOfrecer(Number(e.target.value))}
                      className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    <p className="text-xs text-gray-500 mt-1">Solicitado: {solicitudSeleccionada.cantidadRequerida.toLocaleString()} gal</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Tu precio por galón ($)</label>
                    <input type="number" min={0} step="0.01" value={precioOfrecer} onChange={(e) => setPrecioOfrecer(Number(e.target.value))}
                      className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    <p className="text-xs text-gray-500 mt-1">Precio máx del cliente: ${Number(solicitudSeleccionada.precioMaximo).toFixed(2)}</p>
                  </div>
                </div>
                {cantidadOfrecer > 0 && precioOfrecer > 0 && (
                  <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                    <p className="text-sm text-gray-600">Valor total de tu propuesta</p>
                    <p className="text-3xl font-bold text-red-600 mt-1">${(cantidadOfrecer * precioOfrecer).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    {precioOfrecer <= Number(solicitudSeleccionada.precioMaximo)
                      ? <p className="text-xs text-green-600 mt-2">✓ Dentro del presupuesto del cliente</p>
                      : <p className="text-xs text-orange-500 mt-2">⚠ Supera el precio máximo del cliente</p>}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Notas para el comprador <span className="text-gray-400 normal-case">(opcional)</span></label>
                  <textarea value={notasVendedor} onChange={(e) => setNotasVendedor(e.target.value)} rows={3}
                    placeholder="Ej: Disponibilidad inmediata, certificaciones, condiciones de entrega..."
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-3">
                <button type="button" onClick={() => { setModalContactarOpen(false); setErrorNegociacion(null); }} disabled={submittingNegociacion}
                  className="flex-1 h-12 px-4 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmarContacto} disabled={submittingNegociacion || cantidadOfrecer <= 0 || precioOfrecer <= 0}
                  className="flex-1 h-12 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {submittingNegociacion ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Enviando...</span> : 'Enviar Propuesta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}