'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Package, ShoppingCart, TrendingUp, Search, Plus, Pencil,
  Trash2, Loader2, X, AlertTriangle, CheckCircle, XCircle, Shield,
  Eye, ChevronDown, RefreshCw, UserCheck, UserX,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getAdminStats, getAdminUsers, createAdminUser, updateAdminUser,
  deleteAdminUser, getAllOfertasAdmin, deleteOfertaAdmin,
  getAllSolicitudesAdmin, deleteSolicitudAdmin,
  type AdminUser, type AdminStats,
} from '@/services/admin.service';

// ── helpers ────────────────────────────────────────────────────────────────────
const ROL_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN:       'bg-orange-100 text-orange-700',
  VENDEDOR:    'bg-blue-100 text-blue-700',
  COMPRADOR:   'bg-green-100 text-green-700',
};

const ESTADO_COLORS: Record<string, string> = {
  ACTIVA:   'bg-green-100 text-green-700',
  PAUSADA:  'bg-yellow-100 text-yellow-700',
  VENDIDA:  'bg-blue-100 text-blue-700',
  EXPIRADA: 'bg-red-100 text-red-700',
};

const PAGE_SIZE = 10;

// ── Paginador reutilizable ─────────────────────────────────────────────────────
function Pager({ cur, tot, total, label, onPage }: {
  cur: number; tot: number; total: number; label: string; onPage: (p: number) => void;
}) {
  if (tot <= 1) return null;
  const from = (cur - 1) * PAGE_SIZE + 1;
  const to   = Math.min(cur * PAGE_SIZE, total);
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-gray-100 mt-2">
      <p className="text-xs text-gray-400">
        Mostrando <span className="font-semibold text-gray-600">{from}–{to}</span> de{' '}
        <span className="font-semibold text-gray-600">{total}</span> {label}
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

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: string | number; sub?: string; icon: any; color: string;
}) {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color.split(' ')[0]}`}>
            <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Modal confirmación ─────────────────────────────────────────────────────────
function ConfirmModal({ title, desc, onConfirm, onCancel, loading }: {
  title: string; desc: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{desc}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={loading}
            className="flex-1 h-10 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading}
            className="flex-1 h-10 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Eliminando...</> : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const [stats, setStats]           = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null);

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {}).finally(() => setLoadingStats(false));
  }, []);

  // ── USUARIOS ───────────────────────────────────────────────────────────────
  const [usuarios, setUsuarios]         = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch]     = useState('');
  const [userRolFilter, setUserRolFilter] = useState('');
  const [userPage, setUserPage]         = useState(1);
  const [userModal, setUserModal]       = useState<'create' | 'edit' | 'delete' | 'detail' | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetailData, setUserDetailData] = useState<any>(null);
  const [userForm, setUserForm]         = useState({ email: '', password: '', name: '', role: 'COMPRADOR' });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [userFormError, setUserFormError]     = useState<string | null>(null);

  const cargarUsuarios = useCallback(async () => {
    setLoadingUsers(true);
    try { setUsuarios(await getAdminUsers()); }
    catch { showToast('Error al cargar usuarios', false); }
    finally { setLoadingUsers(false); }
  }, []);

  useEffect(() => { cargarUsuarios(); }, [cargarUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const term = userSearch.toLowerCase();
    return usuarios.filter(u => {
      const matchSearch = !term || (u.name ?? '').toLowerCase().includes(term) || u.email.toLowerCase().includes(term);
      const matchRol    = !userRolFilter || u.role.name === userRolFilter;
      return matchSearch && matchRol;
    });
  }, [usuarios, userSearch, userRolFilter]);

  useEffect(() => { setUserPage(1); }, [userSearch, userRolFilter]);
  const userTotalPages = Math.max(1, Math.ceil(usuariosFiltrados.length / PAGE_SIZE));
  const usuariosPagina = usuariosFiltrados.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  function abrirCrearUsuario() {
    setUserForm({ email: '', password: '', name: '', role: 'COMPRADOR' });
    setUserFormError(null); setUserModal('create');
  }
  function abrirEditarUsuario(u: AdminUser) {
    setSelectedUser(u);
    setUserForm({ email: u.email, password: '', name: u.name ?? '', role: u.role.name });
    setUserFormError(null); setUserModal('edit');
  }
  async function abrirDetalleUsuario(u: AdminUser) {
    setSelectedUser(u); setUserDetailData(null); setUserModal('detail');
    try {
      const { getAdminUser } = await import('@/services/admin.service');
      setUserDetailData(await getAdminUser(u.id));
    } catch { setUserDetailData({ error: 'No se pudo cargar el detalle' }); }
  }
  async function handleCrearUsuario() {
    setUserFormLoading(true); setUserFormError(null);
    try {
      const nuevo = await createAdminUser({ email: userForm.email, password: userForm.password, name: userForm.name || undefined, role: userForm.role as any });
      setUsuarios(prev => [nuevo as any, ...prev]); setUserModal(null);
      showToast('Usuario creado');
    } catch (e: any) { setUserFormError(e.message); }
    finally { setUserFormLoading(false); }
  }
  async function handleEditarUsuario() {
    if (!selectedUser) return;
    setUserFormLoading(true); setUserFormError(null);
    try {
      const updated = await updateAdminUser(selectedUser.id, { name: userForm.name || undefined, email: userForm.email || undefined, role: userForm.role || undefined, password: userForm.password || undefined });
      setUsuarios(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...updated } : u));
      setUserModal(null); showToast('Usuario actualizado');
    } catch (e: any) { setUserFormError(e.message); }
    finally { setUserFormLoading(false); }
  }
  async function handleEliminarUsuario() {
    if (!selectedUser) return;
    setUserFormLoading(true);
    try {
      await deleteAdminUser(selectedUser.id);
      setUsuarios(prev => prev.filter(u => u.id !== selectedUser.id));
      setUserModal(null); showToast('Usuario eliminado');
    } catch (e: any) { showToast(e.message, false); setUserModal(null); }
    finally { setUserFormLoading(false); }
  }
  async function toggleActivo(u: AdminUser) {
    try {
      await updateAdminUser(u.id, { isActive: !u.isActive });
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, isActive: !u.isActive } : x));
      showToast(`Usuario ${!u.isActive ? 'activado' : 'desactivado'}`);
    } catch (e: any) { showToast(e.message, false); }
  }

  // ── OFERTAS ────────────────────────────────────────────────────────────────
  const [ofertas, setOfertas]         = useState<any[]>([]);
  const [loadingOfertas, setLoadingOfertas] = useState(false);
  const [ofertaSearch, setOfertaSearch]     = useState('');
  const [ofertaPage, setOfertaPage]         = useState(1);
  const [deleteOferta, setDeleteOferta]     = useState<any>(null);
  const [deletingOferta, setDeletingOferta] = useState(false);

  const cargarOfertas = useCallback(async () => {
    setLoadingOfertas(true);
    try { setOfertas(await getAllOfertasAdmin()); }
    catch { showToast('Error al cargar ofertas', false); }
    finally { setLoadingOfertas(false); }
  }, []);

  const ofertasFiltradas = useMemo(() => {
    const t = ofertaSearch.toLowerCase();
    return !t ? ofertas : ofertas.filter(o =>
      o.tipoProducto.toLowerCase().includes(t) ||
      o.ciudad.toLowerCase().includes(t) ||
      o.vendedor?.name?.toLowerCase().includes(t)
    );
  }, [ofertas, ofertaSearch]);

  useEffect(() => { setOfertaPage(1); }, [ofertaSearch]);
  const ofertaTotalPages = Math.max(1, Math.ceil(ofertasFiltradas.length / PAGE_SIZE));
  const ofertasPagina    = ofertasFiltradas.slice((ofertaPage - 1) * PAGE_SIZE, ofertaPage * PAGE_SIZE);

  async function handleDeleteOferta() {
    if (!deleteOferta) return;
    setDeletingOferta(true);
    try {
      await deleteOfertaAdmin(deleteOferta.id);
      setOfertas(prev => prev.filter(o => o.id !== deleteOferta.id));
      setDeleteOferta(null); showToast('Oferta eliminada');
    } catch (e: any) { showToast(e.message, false); }
    finally { setDeletingOferta(false); }
  }

  // ── SOLICITUDES ────────────────────────────────────────────────────────────
  const [solicitudes, setSolicitudes]         = useState<any[]>([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(false);
  const [solicitudSearch, setSolicitudSearch]       = useState('');
  const [solicitudPage, setSolicitudPage]           = useState(1);
  const [deleteSolicitud, setDeleteSolicitud]       = useState<any>(null);
  const [deletingSolicitud, setDeletingSolicitud]   = useState(false);

  const cargarSolicitudes = useCallback(async () => {
    setLoadingSolicitudes(true);
    try { setSolicitudes(await getAllSolicitudesAdmin()); }
    catch { showToast('Error al cargar solicitudes', false); }
    finally { setLoadingSolicitudes(false); }
  }, []);

  const solicitudesFiltradas = useMemo(() => {
    const t = solicitudSearch.toLowerCase();
    return !t ? solicitudes : solicitudes.filter(s =>
      s.tipoProducto.toLowerCase().includes(t) ||
      s.ciudad.toLowerCase().includes(t) ||
      s.comprador?.name?.toLowerCase().includes(t)
    );
  }, [solicitudes, solicitudSearch]);

  useEffect(() => { setSolicitudPage(1); }, [solicitudSearch]);
  const solicitudTotalPages = Math.max(1, Math.ceil(solicitudesFiltradas.length / PAGE_SIZE));
  const solicitudesPagina   = solicitudesFiltradas.slice((solicitudPage - 1) * PAGE_SIZE, solicitudPage * PAGE_SIZE);

  async function handleDeleteSolicitud() {
    if (!deleteSolicitud) return;
    setDeletingSolicitud(true);
    try {
      await deleteSolicitudAdmin(deleteSolicitud.id);
      setSolicitudes(prev => prev.filter(s => s.id !== deleteSolicitud.id));
      setDeleteSolicitud(null); showToast('Solicitud eliminada');
    } catch (e: any) { showToast(e.message, false); }
    finally { setDeletingSolicitud(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium animate-in slide-in-from-top-2 ${toast.ok ? 'bg-green-500' : 'bg-red-500'}`}>
          {toast.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-red-50 rounded-xl"><Shield className="w-6 h-6 text-red-500" /></div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 mt-0.5">Gestión completa del sistema</p>
        </div>
      </div>

      {/* Stats */}
      {loadingStats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-0 shadow-lg"><CardContent className="p-5"><div className="h-14 bg-gray-100 rounded-lg animate-pulse" /></CardContent></Card>
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Usuarios"      value={stats.usuarios.total}          sub={`${stats.usuarios.vendedores}V · ${stats.usuarios.compradores}C`}     icon={Users}       color="bg-blue-50 text-blue-600" />
          <StatCard title="Ofertas"       value={stats.ofertas.total}           sub={`${stats.ofertas.activas} activas`}                                     icon={Package}     color="bg-green-50 text-green-600" />
          <StatCard title="Solicitudes"   value={stats.solicitudes.total}       sub={`${stats.solicitudes.activas} activas`}                                 icon={ShoppingCart} color="bg-purple-50 text-purple-600" />
          <StatCard title="Negociaciones" value={stats.negociaciones.total}     sub={`${stats.negociaciones.confirmadas} confirmadas`}                       icon={TrendingUp}  color="bg-orange-50 text-orange-600" />
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList className="bg-white border shadow-sm p-1">
          <TabsTrigger value="usuarios"   className="gap-2" onClick={cargarUsuarios}>  <Users className="w-4 h-4" />Usuarios</TabsTrigger>
          <TabsTrigger value="ofertas"    className="gap-2" onClick={cargarOfertas}>   <Package className="w-4 h-4" />Ofertas</TabsTrigger>
          <TabsTrigger value="solicitudes" className="gap-2" onClick={cargarSolicitudes}><ShoppingCart className="w-4 h-4" />Solicitudes</TabsTrigger>
        </TabsList>

        {/* ══ USUARIOS ══ */}
        <TabsContent value="usuarios">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-red-500" />Usuarios del Sistema</CardTitle>
                  <CardDescription>{usuariosFiltrados.length} usuarios</CardDescription>
                </div>
                <div className="flex gap-2">
                  <button onClick={cargarUsuarios} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
                  <Button onClick={abrirCrearUsuario} className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    <Plus className="w-4 h-4" />Nuevo Usuario
                  </Button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 mt-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="Buscar por nombre o email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <div className="relative">
                  <select value={userRolFilter} onChange={e => setUserRolFilter(e.target.value)}
                    className="h-9 pl-3 pr-8 border border-gray-200 rounded-md text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="">Todos los roles</option>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="COMPRADOR">Comprador</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-red-500" /><span className="ml-2 text-gray-500">Cargando...</span></div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="text-center py-10"><Users className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400">No hay usuarios</p></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Usuario', 'Rol', 'Ofertas', 'Solicitudes', 'Estado', 'Registro', ''].map(h => (
                            <th key={h} className={`py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === '' || h === 'Registro' ? 'text-right' : h === 'Ofertas' || h === 'Solicitudes' || h === 'Estado' ? 'text-center' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {usuariosPagina.map(u => (
                          <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-red-600 font-bold text-xs">{(u.name ?? u.email).charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800 text-sm">{u.name || '—'}</p>
                                  <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${ROL_COLORS[u.role.name] ?? 'bg-gray-100 text-gray-600'}`}>{u.role.name}</span>
                            </td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-700">{u._count.ofertasVenta}</td>
                            <td className="py-3 px-2 text-center font-semibold text-gray-700">{u._count.solicitudesCompra}</td>
                            <td className="py-3 px-2 text-center">
                              <button onClick={() => toggleActivo(u)}
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase transition-colors ${u.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}>
                                {u.isActive ? <><UserCheck className="w-3 h-3" />Activo</> : <><UserX className="w-3 h-3" />Inactivo</>}
                              </button>
                            </td>
                            <td className="py-3 px-2 text-right text-xs text-gray-400">{new Date(u.createdAt).toLocaleDateString('es-CO')}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-1 justify-end">
                                <button onClick={() => abrirDetalleUsuario(u)} className="p-1.5 hover:bg-blue-50 rounded-lg group" title="Ver detalle"><Eye className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" /></button>
                                <button onClick={() => abrirEditarUsuario(u)} className="p-1.5 hover:bg-yellow-50 rounded-lg group" title="Editar"><Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-yellow-600" /></button>
                                <button onClick={() => { setSelectedUser(u); setUserModal('delete'); }} className="p-1.5 hover:bg-red-50 rounded-lg group" title="Eliminar"><Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600" /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pager cur={userPage} tot={userTotalPages} total={usuariosFiltrados.length} label="usuarios" onPage={setUserPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ OFERTAS ══ */}
        <TabsContent value="ofertas">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-red-500" />Todas las Ofertas</CardTitle>
                  <CardDescription>{ofertasFiltradas.length} ofertas</CardDescription>
                </div>
                <button onClick={cargarOfertas} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar por tipo, ciudad o vendedor..." value={ofertaSearch} onChange={e => setOfertaSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingOfertas ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
              ) : ofertasFiltradas.length === 0 ? (
                <div className="text-center py-10"><Package className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400">No hay ofertas</p></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Vendedor', 'Tipo', 'Cantidad', 'Precio', 'Ciudad', 'Estado', 'Fecha', ''].map((h, i) => (
                            <th key={h} className={`py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide ${['Cantidad', 'Precio'].includes(h) ? 'text-right' : i === 7 ? 'text-right' : h === 'Estado' ? 'text-center' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {ofertasPagina.map(o => (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2"><p className="font-semibold text-gray-800">{o.vendedor?.name || '—'}</p><p className="text-xs text-gray-400">{o.vendedor?.email}</p></td>
                            <td className="py-3 px-2 text-xs font-medium text-gray-700">{o.tipoProducto}</td>
                            <td className="py-3 px-2 text-right font-semibold text-gray-700">{Number(o.cantidad).toLocaleString()} gal</td>
                            <td className="py-3 px-2 text-right font-semibold text-red-600">${Number(o.precioUnitario).toFixed(2)}</td>
                            <td className="py-3 px-2 text-xs text-gray-500">{o.ciudad}, {o.pais}</td>
                            <td className="py-3 px-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${ESTADO_COLORS[o.estado] ?? 'bg-gray-100 text-gray-600'}`}>{o.estado}</span></td>
                            <td className="py-3 px-2 text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                            <td className="py-3 px-2 text-right"><button onClick={() => setDeleteOferta(o)} className="p-1.5 hover:bg-red-50 rounded-lg group"><Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pager cur={ofertaPage} tot={ofertaTotalPages} total={ofertasFiltradas.length} label="ofertas" onPage={setOfertaPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ SOLICITUDES ══ */}
        <TabsContent value="solicitudes">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-red-500" />Todas las Solicitudes</CardTitle>
                  <CardDescription>{solicitudesFiltradas.length} solicitudes</CardDescription>
                </div>
                <button onClick={cargarSolicitudes} className="p-2 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-4 h-4 text-gray-500" /></button>
              </div>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Buscar por tipo, ciudad o comprador..." value={solicitudSearch} onChange={e => setSolicitudSearch(e.target.value)} className="pl-9 h-9" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingSolicitudes ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-red-500" /></div>
              ) : solicitudesFiltradas.length === 0 ? (
                <div className="text-center py-10"><ShoppingCart className="w-10 h-10 text-gray-200 mx-auto mb-2" /><p className="text-gray-400">No hay solicitudes</p></div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Comprador', 'Tipo', 'Cantidad', 'Precio máx', 'Ciudad', 'Estado', 'Fecha', ''].map((h, i) => (
                            <th key={h} className={`py-3 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide ${['Cantidad', 'Precio máx'].includes(h) ? 'text-right' : i === 7 ? 'text-right' : h === 'Estado' ? 'text-center' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {solicitudesPagina.map(s => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-2"><p className="font-semibold text-gray-800">{s.comprador?.name || '—'}</p><p className="text-xs text-gray-400">{s.comprador?.email}</p></td>
                            <td className="py-3 px-2 text-xs font-medium text-gray-700">{s.tipoProducto}</td>
                            <td className="py-3 px-2 text-right font-semibold text-gray-700">{Number(s.cantidadRequerida).toLocaleString()} gal</td>
                            <td className="py-3 px-2 text-right font-semibold text-green-600">${Number(s.precioMaximo).toFixed(2)}</td>
                            <td className="py-3 px-2 text-xs text-gray-500">{s.ciudad}, {s.pais}</td>
                            <td className="py-3 px-2 text-center"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${ESTADO_COLORS[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>{s.estado}</span></td>
                            <td className="py-3 px-2 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString('es-CO')}</td>
                            <td className="py-3 px-2 text-right"><button onClick={() => setDeleteSolicitud(s)} className="p-1.5 hover:bg-red-50 rounded-lg group"><Trash2 className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-600" /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pager cur={solicitudPage} tot={solicitudTotalPages} total={solicitudesFiltradas.length} label="solicitudes" onPage={setSolicitudPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODALES USUARIOS */}
      {(userModal === 'create' || userModal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <h2 className="text-lg font-bold text-gray-900">{userModal === 'create' ? 'Crear Usuario' : 'Editar Usuario'}</h2>
              <button onClick={() => setUserModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="px-6 py-5 space-y-4">
              {userFormError && <div className="p-3 bg-red-50 rounded-xl text-sm text-red-600">{userFormError}</div>}
              <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Nombre</label><input type="text" value={userForm.name} onChange={e => setUserForm(p => ({ ...p, name: e.target.value }))} placeholder="Nombre completo" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email *</label><input type="email" value={userForm.email} onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} placeholder="usuario@email.com" required className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" /></div>
              <div><label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">{userModal === 'create' ? 'Contraseña *' : 'Nueva contraseña (dejar vacío para no cambiar)'}</label><input type="password" value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500" /></div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Rol *</label>
                <div className="relative">
                  <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full h-10 pl-3 pr-8 border border-gray-200 rounded-lg text-sm bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option value="COMPRADOR">Comprador</option>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3">
              <button onClick={() => setUserModal(null)} disabled={userFormLoading} className="flex-1 h-10 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50">Cancelar</button>
              <button onClick={userModal === 'create' ? handleCrearUsuario : handleEditarUsuario} disabled={userFormLoading}
                className="flex-1 h-10 rounded-xl font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center gap-2 disabled:opacity-50">
                {userFormLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Guardando...</> : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detalle usuario */}
      {userModal === 'detail' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedUser.name || selectedUser.email}</h2>
                <p className="text-xs text-gray-400">{selectedUser.email}</p>
              </div>
              <button onClick={() => setUserModal(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="overflow-y-auto max-h-[calc(85vh-100px)] px-6 py-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  ['Rol', selectedUser.role.name],
                  ['Estado', selectedUser.isActive ? 'Activo' : 'Inactivo'],
                  ['Ofertas', selectedUser._count.ofertasVenta],
                  ['Solicitudes', selectedUser._count.solicitudesCompra],
                  ['Neg. Vendedor', selectedUser._count.negociacionesVendedor],
                  ['Neg. Comprador', selectedUser._count.negociacionesComprador],
                ].map(([label, value]) => (
                  <div key={label as string} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              {!userDetailData ? (
                <div className="flex items-center justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-red-400" /><span className="ml-2 text-sm text-gray-400">Cargando...</span></div>
              ) : (
                <>
                  {userDetailData.ofertasVenta?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Ofertas publicadas</h3>
                      <div className="space-y-2">
                        {userDetailData.ofertasVenta.map((o: any) => (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="font-semibold text-gray-800">{o.tipoProducto}</span>
                            <span className="text-gray-500">{Number(o.cantidad).toLocaleString()} gal · <span className="text-red-600 font-semibold">${Number(o.precioUnitario).toFixed(2)}/gal</span></span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${ESTADO_COLORS[o.estado] ?? 'bg-gray-100 text-gray-600'}`}>{o.estado}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {userDetailData.solicitudesCompra?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Solicitudes publicadas</h3>
                      <div className="space-y-2">
                        {userDetailData.solicitudesCompra.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                            <span className="font-semibold text-gray-800">{s.tipoProducto}</span>
                            <span className="text-gray-500">{Number(s.cantidadRequerida).toLocaleString()} gal · <span className="text-green-600 font-semibold">máx ${Number(s.precioMaximo).toFixed(2)}</span></span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${ESTADO_COLORS[s.estado] ?? 'bg-gray-100 text-gray-600'}`}>{s.estado}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {userModal === 'delete' && selectedUser && <ConfirmModal title="¿Eliminar usuario?" desc={`Se eliminará permanentemente a ${selectedUser.name || selectedUser.email} y todos sus datos.`} onConfirm={handleEliminarUsuario} onCancel={() => setUserModal(null)} loading={userFormLoading} />}
      {deleteOferta && <ConfirmModal title="¿Eliminar oferta?" desc={`${deleteOferta.tipoProducto} · ${Number(deleteOferta.cantidad).toLocaleString()} gal de ${deleteOferta.vendedor?.name}`} onConfirm={handleDeleteOferta} onCancel={() => setDeleteOferta(null)} loading={deletingOferta} />}
      {deleteSolicitud && <ConfirmModal title="¿Eliminar solicitud?" desc={`${deleteSolicitud.tipoProducto} · ${Number(deleteSolicitud.cantidadRequerida).toLocaleString()} gal de ${deleteSolicitud.comprador?.name}`} onConfirm={handleDeleteSolicitud} onCancel={() => setDeleteSolicitud(null)} loading={deletingSolicitud} />}
    </div>
  );
}