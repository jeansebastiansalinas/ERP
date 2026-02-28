'use client';

import { useState, useEffect } from 'react';
import {
  Search, Plus, Download, Fuel, MapPin,
  Calendar, TrendingUp, Users, Package,
  X, Loader2, ChevronDown,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getCurrentUserId } from '@/lib/get-current-user-id';                         // ← CAMBIO
import { createNegociacion } from '@/services/negociaciones.service';
import { getOfertas, type OfertaVenta } from '@/services/ofertas.service';
import { createSolicitud, type CreateSolicitudData } from '@/services/solicitudes.service';

const TIPO_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  DIESEL:             { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Diesel' },
  GASOLINA_CORRIENTE: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Corriente' },
  GASOLINA_EXTRA:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Extra' },
  JET_FUEL:           { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Jet Fuel' },
  GLP:                { bg: 'bg-orange-100', text: 'text-orange-700', label: 'GLP' },
};

const SOLICITUD_INICIAL: CreateSolicitudData = {
  tipoProducto: 'DIESEL',
  cantidadRequerida: 0,
  precioMaximo: 0,
  pais: '',
  ciudad: '',
  direccionEntrega: '',
  fechaRequerida: '',
  fechaExpiracion: '',
  descripcion: '',
};

export default function VendedoresPage() {


  const [ofertas, setOfertas]         = useState<OfertaVenta[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filtroTipo, setFiltroTipo]   = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [formData, setFormData]       = useState<CreateSolicitudData>(SOLICITUD_INICIAL);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [successMsg, setSuccessMsg]   = useState<string | null>(null);

  const [modalInteresOpen, setModalInteresOpen]     = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState<OfertaVenta | null>(null);
  const [cantidadNegociar, setCantidadNegociar]     = useState(0);
  const [precioNegociar, setPrecioNegociar]         = useState(0);
  const [notasComprador, setNotasComprador]         = useState('');
  const [submittingNegociacion, setSubmittingNegociacion] = useState(false);
  const [errorNegociacion, setErrorNegociacion]     = useState<string | null>(null);

  useEffect(() => { cargarOfertas(); }, []);

  async function cargarOfertas() {
    try {
      setLoading(true);
      setError(null);
      const data = await getOfertas();
      setOfertas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar ofertas');
    } finally {
      setLoading(false);
    }
  }

  const ofertasFiltradas = ofertas.filter((o) => {
    const coincideBusqueda =
      o.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.pais.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.vendedor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const coincideTipo = filtroTipo ? o.tipoProducto === filtroTipo : true;
    return coincideBusqueda && coincideTipo;
  });

  function handleMeInteresa(oferta: OfertaVenta) {
    setOfertaSeleccionada(oferta);
    setCantidadNegociar(oferta.cantidad);
    setPrecioNegociar(Number(oferta.precioUnitario));
    setNotasComprador('');
    setErrorNegociacion(null);
    setModalInteresOpen(true);
  }

  // ── CORREGIDO: usa user del hook ─────────────────────────────────────────────
  async function handleConfirmarInteres() {
    if (!ofertaSeleccionada) return;

    const compradorId = getCurrentUserId();
    if (!compradorId) {
      setErrorNegociacion('No hay sesión activa. Por favor inicia sesión nuevamente.');
      return;
    }

    setSubmittingNegociacion(true);
    setErrorNegociacion(null);

    try {
      await createNegociacion({
        vendedorId: ofertaSeleccionada.vendedorId,
        compradorId,
        ofertaId: ofertaSeleccionada.id,
        tipoProducto: ofertaSeleccionada.tipoProducto,
        cantidad: cantidadNegociar,
        precioUnitario: precioNegociar,
        incluyeFlete: ofertaSeleccionada.incluyeFlete,
        costoFlete: 0,
        direccionEntrega: ofertaSeleccionada.ubicacion,
        ciudad: ofertaSeleccionada.ciudad,
        pais: ofertaSeleccionada.pais,
        notasComprador,
      });
      setSuccessMsg('¡Interés registrado! El vendedor recibirá tu solicitud.');
      setModalInteresOpen(false);
      setOfertaSeleccionada(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorNegociacion(err.message || 'Error al registrar interés');
    } finally {
      setSubmittingNegociacion(false);
    }
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await createSolicitud({
        ...formData,
        fechaExpiracion: formData.fechaExpiracion || undefined,
        descripcion:     formData.descripcion     || undefined,
      });
      setSuccessMsg('¡Tu solicitud fue publicada! Los vendedores ya pueden verla.');
      setFormData(SOLICITUD_INICIAL);
      setModalOpen(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setFormError(err.message || 'Error al publicar la solicitud');
    } finally {
      setSubmitting(false);
    }
  }

  const totalOfertas     = ofertas.length;
  const ofertasActivas   = ofertas.filter((o) => o.estado === 'ACTIVA').length;
  const vendedoresUnicos = new Set(ofertas.map((o) => o.vendedorId)).size;

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
          <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
          <p className="text-gray-600 mt-1">Ofertas de combustible disponibles de vendedores</p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
          <Plus className="w-4 h-4" />
          Publicar mi Solicitud
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Ofertas', value: totalOfertas, icon: Package, color: 'bg-blue-50 text-blue-600' },
          { label: 'Ofertas Activas', value: ofertasActivas, icon: TrendingUp, color: 'bg-green-50 text-green-600' },
          { label: 'Vendedores Activos', value: vendedoresUnicos, icon: Users, color: 'bg-purple-50 text-purple-600' },
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
              <Input type="search" placeholder="Buscar por ciudad, país o vendedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
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
          <CardTitle className="flex items-center gap-2"><Fuel className="w-5 h-5 text-red-600" />Ofertas de Vendedores</CardTitle>
          <CardDescription>{ofertasFiltradas.length} ofertas encontradas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-red-500" /><span className="ml-3 text-gray-600">Cargando ofertas...</span></div>}
          {error && !loading && <div className="text-center py-12"><p className="text-red-500 mb-3">{error}</p><Button variant="outline" onClick={cargarOfertas}>Reintentar</Button></div>}
          {!loading && !error && ofertasFiltradas.length === 0 && (
            <div className="text-center py-12">
              <Fuel className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No hay ofertas disponibles aún</p>
            </div>
          )}
          {!loading && !error && (
            <div className="space-y-4">
              {ofertasFiltradas.map((oferta) => {
                const tipo = TIPO_COLORS[oferta.tipoProducto] ?? { bg: 'bg-gray-100', text: 'text-gray-700', label: oferta.tipoProducto };
                return (
                  <div key={oferta.id} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${tipo.bg} flex-shrink-0`}>
                          <Fuel className={`w-6 h-6 ${tipo.text}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{oferta.cantidad.toLocaleString()} galones disponibles</h3>
                            <Badge className={`${tipo.bg} ${tipo.text} border-0`}>{tipo.label}</Badge>
                          </div>
                          <p className="text-2xl font-bold text-red-600">
                            ${Number(oferta.precioUnitario).toFixed(2)}
                            <span className="text-sm font-normal text-gray-500"> / galón</span>
                          </p>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{oferta.ciudad}, {oferta.pais}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Disponible: {new Date(oferta.fechaDisponible).toLocaleDateString('es-CO')}</span>
                          </div>
                          {oferta.descripcion && <p className="text-sm text-gray-500 mt-1">{oferta.descripcion}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className="bg-green-100 text-green-700 border-0">{oferta.estado}</Badge>
                        <p className="text-sm text-gray-600">Vendedor: <span className="font-semibold">{oferta.vendedor.name}</span></p>
                        {oferta.incluyeFlete && <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Incluye flete</Badge>}
                        <p className="text-xs text-gray-400">Total: ${(oferta.cantidad * Number(oferta.precioUnitario)).toLocaleString()}</p>
                        <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white mt-1" onClick={() => handleMeInteresa(oferta)}>
                          Me interesa
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

      {/* ═══ MODAL — Publicar Solicitud ═══ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative px-6 pt-6 pb-4">
              <button onClick={() => { setModalOpen(false); setFormError(null); }} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-red-50 rounded-xl"><Package className="w-6 h-6 text-red-500" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Nueva Solicitud</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Publica tu necesidad de combustible</p>
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
                          <option value="GASOLINA_CORRIENTE">Gasolina Corriente</option>
                          <option value="GASOLINA_EXTRA">Gasolina Extra</option>
                          <option value="JET_FUEL">Jet Fuel</option>
                          <option value="GLP">GLP</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cantidad (gal)</label>
                      <input type="number" name="cantidadRequerida" min={1} value={formData.cantidadRequerida || ''} onChange={handleFormChange} placeholder="5000" required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Precio máx/Gal ($)</label>
                      <input type="number" name="precioMaximo" min={0} step="0.01" value={formData.precioMaximo || ''} onChange={handleFormChange} placeholder="2.80" required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                  </div>
                  {formData.cantidadRequerida > 0 && formData.precioMaximo > 0 && (
                    <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border border-red-100">
                      <p className="text-sm text-gray-600">Presupuesto máximo total</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">${(formData.cantidadRequerida * formData.precioMaximo).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Dirección entrega</label>
                      <input type="text" name="direccionEntrega" value={formData.direccionEntrega} onChange={handleFormChange} placeholder="Carrera 10 #25-30" required
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
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Fecha que necesitas el combustible</label>
                      <input type="date" name="fechaRequerida" value={formData.fechaRequerida} onChange={handleFormChange} required
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Fecha expiración <span className="text-gray-400 normal-case font-normal">(opcional)</span></label>
                      <input type="date" name="fechaExpiracion" value={formData.fechaExpiracion} onChange={handleFormChange}
                        className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Descripción <span className="text-gray-400 normal-case font-normal">(opcional)</span></label>
                    <textarea name="descripcion" value={formData.descripcion} onChange={handleFormChange} rows={3} placeholder="Especificaciones del producto, condiciones especiales, etc."
                      className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none" />
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
                  {submitting ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Publicando...</span> : 'Publicar Solicitud'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL — Me Interesa ═══ */}
      {modalInteresOpen && ofertaSeleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="relative px-6 pt-6 pb-4">
              <button onClick={() => { setModalInteresOpen(false); setErrorNegociacion(null); }} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-400" />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-green-50 rounded-xl"><Fuel className="w-6 h-6 text-green-500" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Me Interesa Esta Oferta</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Confirma los detalles de tu pedido</p>
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
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Detalles de la Oferta</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Vendedor</p><p className="font-semibold text-gray-900">{ofertaSeleccionada.vendedor.name}</p></div>
                  <div><p className="text-gray-500">Tipo Combustible</p><p className="font-semibold text-gray-900">{ofertaSeleccionada.tipoProducto}</p></div>
                  <div><p className="text-gray-500">Disponible</p><p className="font-semibold text-gray-900">{ofertaSeleccionada.cantidad.toLocaleString()} gal</p></div>
                  <div><p className="text-gray-500">Precio Original</p><p className="font-semibold text-gray-900">${Number(ofertaSeleccionada.precioUnitario).toFixed(2)}/gal</p></div>
                  <div><p className="text-gray-500">Ubicación</p><p className="font-semibold text-gray-900">{ofertaSeleccionada.ciudad}, {ofertaSeleccionada.pais}</p></div>
                  <div><p className="text-gray-500">Incluye Flete</p><p className="font-semibold text-gray-900">{ofertaSeleccionada.incluyeFlete ? 'Sí' : 'No'}</p></div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">¿Cuánto necesitas?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Cantidad (galones)</label>
                    <input type="number" min={1} max={ofertaSeleccionada.cantidad} value={cantidadNegociar} onChange={(e) => setCantidadNegociar(Number(e.target.value))}
                      className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
                    <p className="text-xs text-gray-500 mt-1">Máximo: {ofertaSeleccionada.cantidad.toLocaleString()} gal</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Precio por Galón ($)</label>
                    <input type="number" min={0} step="0.01" value={precioNegociar} onChange={(e) => setPrecioNegociar(Number(e.target.value))}
                      className="w-full h-12 px-4 bg-gray-50 border-0 rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all" />
                    <p className="text-xs text-gray-500 mt-1">Precio sugerido: ${Number(ofertaSeleccionada.precioUnitario).toFixed(2)}</p>
                  </div>
                </div>
                {cantidadNegociar > 0 && precioNegociar > 0 && (
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <p className="text-sm text-gray-600">Total a pagar</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">${(cantidadNegociar * precioNegociar).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    {ofertaSeleccionada.incluyeFlete && <p className="text-xs text-gray-500 mt-2">✓ Incluye transporte</p>}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Notas para el vendedor <span className="text-gray-400 normal-case">(opcional)</span></label>
                  <textarea value={notasComprador} onChange={(e) => setNotasComprador(e.target.value)} rows={3} placeholder="Ej: Necesito entrega urgente, horario preferido, etc."
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-green-500 focus:bg-white transition-all resize-none" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex gap-3">
                <button type="button" onClick={() => { setModalInteresOpen(false); setErrorNegociacion(null); }} disabled={submittingNegociacion}
                  className="flex-1 h-12 px-4 rounded-xl font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmarInteres} disabled={submittingNegociacion || cantidadNegociar <= 0 || precioNegociar <= 0}
                  className="flex-1 h-12 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  {submittingNegociacion ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Enviando...</span> : 'Confirmar Interés'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}