'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell, Search, Menu, X, Home, Truck, Package,
  Users, UserCircle, BarChart3, Settings, LogOut,
  Calendar, CheckCheck, User, ChevronRight,
  Pencil, Trash2, Plus, Loader2, AlertTriangle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getMisNotificaciones, marcarLeida, marcarTodasLeidas, type Notificacion,
} from '@/services/notificaciones.service';
import {
  getMisOfertas, updateOferta, deleteOferta, type OfertaVenta,
} from '@/services/ofertas.service';
import {
  getMisSolicitudes, updateSolicitud, deleteSolicitud, type SolicitudCompra,
} from '@/services/solicitudes.service';

interface DashboardLayoutProps { children: ReactNode; }

// ── helpers ──────────────────────────────────────────────────────────────────
const ESTADO_COLORS: Record<string, string> = {
  ACTIVA:     'bg-green-100 text-green-700',
  INACTIVA:   'bg-gray-100 text-gray-600',
  EXPIRADA:   'bg-red-100 text-red-600',
  VENDIDA:    'bg-blue-100 text-blue-600',
  COMPLETADA: 'bg-blue-100 text-blue-600',
};

function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${ESTADO_COLORS[estado] ?? 'bg-gray-100 text-gray-600'}`}>
      {estado}
    </span>
  );
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const router    = useRouter();
  const pathname  = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── notificaciones ──────────────────────────────────────────────────────────
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const cargarNotificaciones = useCallback(async () => {
    try { setNotificaciones(await getMisNotificaciones()); } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargarNotificaciones();
    const iv = setInterval(cargarNotificaciones, 30_000);
    return () => clearInterval(iv);
  }, [cargarNotificaciones]);

  async function handleMarcarLeida(id: string, negociacionId?: string) {
    await marcarLeida(id);
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: true } : n));
    if (negociacionId) { setBellOpen(false); router.push('/dashboard/envios'); }
  }
  async function handleMarcarTodas() {
    await marcarTodasLeidas();
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  // ── perfil / mis publicaciones ──────────────────────────────────────────────
  const [profileOpen, setProfileOpen]           = useState(false);
  const [misPublicaciones, setMisPublicaciones] = useState<(OfertaVenta | SolicitudCompra)[]>([]);
  const [loadingPub, setLoadingPub]             = useState(false);
  const [pubView, setPubView]                   = useState<'menu' | 'list' | 'edit' | 'confirm-delete'>('menu');
  const [editItem, setEditItem]                 = useState<any>(null);
  const [deleteItem, setDeleteItem]             = useState<any>(null);
  const [editLoading, setEditLoading]           = useState(false);
  const [deleteLoading, setDeleteLoading]       = useState(false);
  const [pubError, setPubError]                 = useState<string | null>(null);
  const [editForm, setEditForm]                 = useState<Record<string, any>>({});

  const isVendedor  = user?.role === 'VENDEDOR';
  const isComprador = user?.role === 'COMPRADOR';
  const isAdmin     = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  async function cargarMisPublicaciones() {
    setLoadingPub(true);
    setPubError(null);
    try {
      if (isVendedor || isAdmin)   setMisPublicaciones(await getMisOfertas());
      else if (isComprador)        setMisPublicaciones(await getMisSolicitudes());
    } catch (e: any) {
      setPubError(e.message || 'Error al cargar publicaciones');
    } finally {
      setLoadingPub(false);
    }
  }

  function abrirListado() {
    cargarMisPublicaciones();
    setPubView('list');
  }

  function abrirEdicion(item: any) {
    setEditItem(item);
    // Pre-poblar formulario con campos editables
    if (isVendedor || isAdmin) {
      setEditForm({
        cantidad:       item.cantidad,
        precioUnitario: Number(item.precioUnitario),
        descripcion:    item.descripcion ?? '',
        estado:         item.estado,
      });
    } else {
      setEditForm({
        cantidadRequerida: item.cantidadRequerida,
        precioMaximo:      Number(item.precioMaximo),
        descripcion:       item.descripcion ?? '',
        estado:            item.estado,
      });
    }
    setPubView('edit');
  }

  async function handleGuardarEdicion() {
    if (!editItem) return;
    setEditLoading(true);
    setPubError(null);
    try {
      if (isVendedor || isAdmin) await updateOferta(editItem.id, editForm);
      else                       await updateSolicitud(editItem.id, editForm);
      await cargarMisPublicaciones();
      setPubView('list');
    } catch (e: any) {
      setPubError(e.message);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleConfirmarEliminar() {
    if (!deleteItem) return;
    setDeleteLoading(true);
    setPubError(null);
    try {
      if (isVendedor || isAdmin) await deleteOferta(deleteItem.id);
      else                       await deleteSolicitud(deleteItem.id);
      setMisPublicaciones((prev) => prev.filter((p) => p.id !== deleteItem.id));
      setDeleteItem(null);
      setPubView('list');
    } catch (e: any) {
      setPubError(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  function cerrarPerfil() {
    setProfileOpen(false);
    setPubView('menu');
    setEditItem(null);
    setDeleteItem(null);
    setPubError(null);
  }

  // ── menu items ──────────────────────────────────────────────────────────────
  const menuItems = [
    { icon: Home,        label: 'Dashboard',     href: '/dashboard',               roles: ['ADMIN','VENDEDOR','COMPRADOR','SUPER_ADMIN'] },
    { icon: Users,       label: 'Clientes',      href: '/dashboard/clientes',      roles: ['ADMIN','VENDEDOR','SUPER_ADMIN'] },
    { icon: UserCircle,  label: 'Vendedores',    href: '/dashboard/vendedores',    roles: ['ADMIN','COMPRADOR','SUPER_ADMIN'] },
    { icon: Package,     label: 'Envíos',        href: '/dashboard/envios',        roles: ['ADMIN','VENDEDOR','COMPRADOR','SUPER_ADMIN'] },
    { icon: BarChart3,   label: 'Reportes',      href: '/dashboard/reportes',      roles: ['ADMIN','VENDEDOR','COMPRADOR','SUPER_ADMIN'] },
    { icon: Settings,    label: 'Configuración', href: '/dashboard/configuracion', roles: ['ADMIN','SUPER_ADMIN'] },
  ];
  const userRole          = user?.role || 'COMPRADOR';
  const filteredMenuItems = menuItems.filter((i) => i.roles.includes(userRole));
  const isActive          = (href: string) => pathname === href;

  function notifIcon(tipo: string) {
    if (tipo === 'NUEVA_PROPUESTA')   return '📦';
    if (tipo === 'PROPUESTA_ACEPTADA') return '✅';
    return '❌';
  }
  function notifBg(tipo: string) {
    if (tipo === 'NUEVA_PROPUESTA')   return 'bg-blue-100';
    if (tipo === 'PROPUESTA_ACEPTADA') return 'bg-green-100';
    return 'bg-red-100';
  }

  const pubLabel = isVendedor ? 'Mis Ofertas' : isComprador ? 'Mis Solicitudes' : 'Mis Publicaciones';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-red-600 to-red-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-red-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">ERP Business</h1>
                <p className="text-red-200 text-xs">Insight</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <button key={item.href} onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive(item.href) ? 'bg-white/20 text-white shadow-lg' : 'text-red-100 hover:bg-white/10 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.href === '/dashboard/envios' && notificaciones.filter((n) => n.tipo === 'PROPUESTA_ACEPTADA' && !n.leida).length > 0 && (
                  <span className="ml-auto w-2 h-2 bg-white rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* User */}
          <div className="p-4 border-t border-red-500/30">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Avatar className="w-10 h-10 border-2 border-white/30">
                <AvatarImage src="" />
                <AvatarFallback className="bg-white/20 text-white font-bold">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{user?.name || 'Usuario'}</p>
                <p className="text-red-200 text-xs truncate">{user?.email}</p>
                <div className="mt-1">
                  <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full text-white/90 uppercase font-semibold">{user?.role || 'Invitado'}</span>
                </div>
              </div>
              <button onClick={() => { signOut(); router.push('/login'); }} className="text-red-200 hover:text-white transition-colors" title="Cerrar sesión">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ══════════════════ MAIN ══════════════════ */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input type="search" placeholder="Buscar..." className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </Button>

              {/* ── CAMPANA ── */}
              <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {noLeidas > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold px-1">{noLeidas > 9 ? '9+' : noLeidas}</span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 p-0 shadow-xl">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Notificaciones</p>
                      {noLeidas > 0 ? <p className="text-xs text-gray-500">{noLeidas} sin leer</p> : <p className="text-xs text-gray-400">Todo al día</p>}
                    </div>
                    {noLeidas > 0 && (
                      <button onClick={handleMarcarTodas} className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition-colors">
                        <CheckCheck className="w-3.5 h-3.5" />Marcar todas
                      </button>
                    )}
                  </div>
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
                    {notificaciones.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><Bell className="w-6 h-6 text-gray-400" /></div>
                        <p className="text-sm font-medium text-gray-700">Sin notificaciones</p>
                        <p className="text-xs text-gray-400 mt-1">Te avisaremos cuando haya novedades</p>
                      </div>
                    ) : notificaciones.map((n) => (
                      <div key={n.id} onClick={() => handleMarcarLeida(n.id, n.negociacionId)}
                        className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.leida ? 'bg-red-50/40' : 'bg-white'}`}>
                        <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base ${notifBg(n.tipo)}`}>{notifIcon(n.tipo)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!n.leida ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>{n.titulo}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {!n.leida && <div className="flex-shrink-0 mt-2"><div className="w-2 h-2 bg-red-500 rounded-full" /></div>}
                      </div>
                    ))}
                  </div>
                  {notificaciones.length > 0 && (
                    <div className="px-4 py-2.5 border-t bg-gray-50 rounded-b-lg">
                      <button onClick={() => { setBellOpen(false); router.push('/dashboard/envios'); }} className="text-xs text-red-600 hover:text-red-700 font-medium w-full text-center transition-colors">
                        Ver todos los envíos y negociaciones →
                      </button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden sm:block h-8 w-px bg-gray-200" />

              {/* ══════════════ AVATAR + MENÚ PERFIL ══════════════ */}
              <DropdownMenu open={profileOpen} onOpenChange={(o) => { if (!o) cerrarPerfil(); else setProfileOpen(true); }}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-colors group">
                    <Avatar className="w-9 h-9 border-2 border-gray-200 group-hover:border-red-400 transition-colors">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-red-100 text-red-600 font-bold">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-xs font-semibold text-gray-800 leading-tight">{user?.name || 'Usuario'}</p>
                      <p className="text-[10px] text-gray-400 leading-tight">{user?.role}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl border border-gray-100 rounded-2xl overflow-hidden">

                  {/* ─── VISTA: menú principal ─── */}
                  {pubView === 'menu' && (
                    <>
                      {/* Cabecera del perfil */}
                      <div className="bg-gradient-to-br from-red-500 to-red-600 px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-12 h-12 border-2 border-white/40">
                            <AvatarFallback className="bg-white/20 text-white font-bold text-lg">{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-bold text-sm">{user?.name}</p>
                            <p className="text-red-200 text-xs">{user?.email}</p>
                            <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full text-white font-semibold uppercase mt-1 inline-block">{user?.role}</span>
                          </div>
                        </div>
                      </div>

                      {/* Opciones */}
                      <div className="py-2">
                        <button onClick={abrirListado}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                              <Package className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-800">{pubLabel}</p>
                              <p className="text-xs text-gray-400">Gestiona tus publicaciones</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        </button>

                        <div className="mx-4 border-t border-gray-100 my-1" />

                        <button onClick={() => { cerrarPerfil(); signOut(); router.push('/login'); }}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors group text-left">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-red-100 transition-colors">
                            <LogOut className="w-4 h-4 text-gray-500 group-hover:text-red-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 group-hover:text-red-600">Cerrar sesión</p>
                        </button>
                      </div>
                    </>
                  )}

                  {/* ─── VISTA: listado de publicaciones ─── */}
                  {pubView === 'list' && (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <button onClick={() => setPubView('menu')} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                          <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                        </button>
                        <p className="font-semibold text-gray-800 text-sm">{pubLabel}</p>
                      </div>

                      {pubError && (
                        <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{pubError}</div>
                      )}

                      <div className="max-h-[380px] overflow-y-auto">
                        {loadingPub ? (
                          <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-red-500" />
                          </div>
                        ) : misPublicaciones.length === 0 ? (
                          <div className="py-10 text-center px-4">
                            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No tienes publicaciones aún</p>
                            <p className="text-xs text-gray-400 mt-1">Crea tu primera {isVendedor ? 'oferta' : 'solicitud'} desde la página principal</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-50">
                            {misPublicaciones.map((item: any) => (
                              <div key={item.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-xs font-bold text-gray-800 truncate">
                                        {item.tipoProducto}
                                      </span>
                                      <EstadoBadge estado={item.estado} />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      {isVendedor || isAdmin
                                        ? `${item.cantidad?.toLocaleString()} gal · $${Number(item.precioUnitario).toFixed(2)}/gal`
                                        : `${item.cantidadRequerida?.toLocaleString()} gal · máx $${Number(item.precioMaximo).toFixed(2)}/gal`
                                      }
                                    </p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">
                                      {item.ciudad}, {item.pais}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <button onClick={() => abrirEdicion(item)}
                                      className="p-1.5 hover:bg-blue-50 rounded-lg transition-colors group" title="Editar">
                                      <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                                    </button>
                                    <button onClick={() => { setDeleteItem(item); setPubView('confirm-delete'); }}
                                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group" title="Eliminar">
                                      <Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* ─── VISTA: formulario de edición ─── */}
                  {pubView === 'edit' && editItem && (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <button onClick={() => setPubView('list')} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                          <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                        </button>
                        <p className="font-semibold text-gray-800 text-sm">Editar publicación</p>
                      </div>

                      {pubError && (
                        <div className="mx-3 mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{pubError}</div>
                      )}

                      <div className="px-4 py-4 space-y-3 max-h-[380px] overflow-y-auto">
                        {/* Cantidad */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            {isVendedor || isAdmin ? 'Cantidad (gal)' : 'Cantidad requerida (gal)'}
                          </label>
                          <input type="number" min={1}
                            value={isVendedor || isAdmin ? editForm.cantidad : editForm.cantidadRequerida}
                            onChange={(e) => setEditForm((p) => ({
                              ...p,
                              [isVendedor || isAdmin ? 'cantidad' : 'cantidadRequerida']: Number(e.target.value),
                            }))}
                            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>

                        {/* Precio */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">
                            {isVendedor || isAdmin ? 'Precio por galón ($)' : 'Precio máximo ($)'}
                          </label>
                          <input type="number" min={0} step="0.01"
                            value={isVendedor || isAdmin ? editForm.precioUnitario : editForm.precioMaximo}
                            onChange={(e) => setEditForm((p) => ({
                              ...p,
                              [isVendedor || isAdmin ? 'precioUnitario' : 'precioMaximo']: Number(e.target.value),
                            }))}
                            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>

                        {/* Estado */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Estado</label>
                          <select value={editForm.estado}
                            onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))}
                            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                            <option value="ACTIVA">Activa</option>
                            <option value="INACTIVA">Inactiva (pausar)</option>
                            {(isVendedor || isAdmin) && <option value="VENDIDA">Vendida</option>}
                            {isComprador && <option value="COMPLETADA">Completada</option>}
                          </select>
                        </div>

                        {/* Descripción */}
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1">Descripción</label>
                          <textarea rows={2} value={editForm.descripcion}
                            onChange={(e) => setEditForm((p) => ({ ...p, descripcion: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
                        </div>

                        {/* Botones */}
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => setPubView('list')} disabled={editLoading}
                            className="flex-1 h-9 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
                            Cancelar
                          </button>
                          <button type="button" onClick={handleGuardarEdicion} disabled={editLoading}
                            className="flex-1 h-9 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1">
                            {editLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Guardando...</> : 'Guardar cambios'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* ─── VISTA: confirmar eliminación ─── */}
                  {pubView === 'confirm-delete' && deleteItem && (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <button onClick={() => { setDeleteItem(null); setPubView('list'); }} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                          <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
                        </button>
                        <p className="font-semibold text-gray-800 text-sm">Confirmar eliminación</p>
                      </div>
                      <div className="px-5 py-6 text-center">
                        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <AlertTriangle className="w-7 h-7 text-red-600" />
                        </div>
                        <p className="text-sm font-semibold text-gray-800 mb-1">¿Eliminar esta publicación?</p>
                        <p className="text-xs text-gray-500 mb-1">
                          <span className="font-medium">{deleteItem.tipoProducto}</span>
                          {' · '}{isVendedor || isAdmin
                            ? `${deleteItem.cantidad?.toLocaleString()} gal`
                            : `${deleteItem.cantidadRequerida?.toLocaleString()} gal`}
                        </p>
                        <p className="text-xs text-gray-400 mb-5">Esta acción no se puede deshacer.</p>
                        {pubError && <p className="text-xs text-red-500 mb-3">{pubError}</p>}
                        <div className="flex gap-2">
                          <button onClick={() => { setDeleteItem(null); setPubView('list'); }} disabled={deleteLoading}
                            className="flex-1 h-9 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors">
                            Cancelar
                          </button>
                          <button onClick={handleConfirmarEliminar} disabled={deleteLoading}
                            className="flex-1 h-9 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-1">
                            {deleteLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Eliminando...</> : 'Sí, eliminar'}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}