'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  Bell,
  Search,
  Menu,
  X,
  Home,
  Truck,
  Package,
  Users,
  UserCircle,
  BarChart3,
  Settings,
  LogOut,
  Calendar,
  CheckCheck,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getMisNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
  type Notificacion,
} from '@/services/notificaciones.service';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Estado notificaciones ──────────────────────
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [bellOpen, setBellOpen] = useState(false);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  const cargarNotificaciones = useCallback(async () => {
    try {
      const data = await getMisNotificaciones();
      setNotificaciones(data);
    } catch {
      // silencioso — no interrumpir la UI
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();
    // Polling cada 30 segundos para nuevas notificaciones
    const interval = setInterval(cargarNotificaciones, 30_000);
    return () => clearInterval(interval);
  }, [cargarNotificaciones]);

  async function handleMarcarLeida(id: string, negociacionId?: string) {
    await marcarLeida(id);
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n)),
    );
    // Si tiene negociación, navegar a envíos
    if (negociacionId) {
      setBellOpen(false);
      router.push('/dashboard/envios');
    }
  }

  async function handleMarcarTodas() {
    await marcarTodasLeidas();
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  }

  // ── Logout ─────────────────────────────────────
  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  // ── Menu ───────────────────────────────────────
  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      href: '/dashboard',
      roles: ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN'],
    },
    {
      icon: Users,
      label: 'Clientes',
      href: '/dashboard/clientes',
      roles: ['ADMIN', 'VENDEDOR', 'SUPER_ADMIN'],
    },
    {
      icon: UserCircle,
      label: 'Vendedores',
      href: '/dashboard/vendedores',
      roles: ['ADMIN', 'COMPRADOR', 'SUPER_ADMIN'],
    },
    {
      icon: Package,
      label: 'Envíos',
      href: '/dashboard/envios',
      roles: ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN'],
    },
    {
      icon: BarChart3,
      label: 'Reportes',
      href: '/dashboard/reportes',
      roles: ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN'],
    },
    {
      icon: Settings,
      label: 'Configuración',
      href: '/dashboard/configuracion',
      roles: ['ADMIN', 'SUPER_ADMIN'],
    },
  ];

  const userRole = user?.role || 'COMPRADOR';
  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userRole),
  );
  const isActive = (href: string) => pathname === href;

  // ── Icono y color según tipo de notificación ───
  function notifIcon(tipo: string) {
    if (tipo === 'NUEVA_PROPUESTA') return '📦';
    if (tipo === 'PROPUESTA_ACEPTADA') return '✅';
    return '❌';
  }

  function notifBg(tipo: string) {
    if (tipo === 'NUEVA_PROPUESTA') return 'bg-blue-100';
    if (tipo === 'PROPUESTA_ACEPTADA') return 'bg-green-100';
    return 'bg-red-100';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ====== SIDEBAR ====== */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-red-600 to-red-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-red-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {/* Badge en "Envíos" si hay notificaciones ACEPTADAS sin leer */}
                {item.href === '/dashboard/envios' &&
                  notificaciones.filter(
                    (n) => n.tipo === 'PROPUESTA_ACEPTADA' && !n.leida,
                  ).length > 0 && (
                    <span className="ml-auto w-2 h-2 bg-white rounded-full" />
                  )}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-red-500/30">
            <div className="flex items-center gap-3 px-4 py-3 bg-white/10 rounded-lg backdrop-blur-sm">
              <Avatar className="w-10 h-10 border-2 border-white/30">
                <AvatarImage src="" />
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {user?.name || 'Usuario'}
                </p>
                <p className="text-red-200 text-xs truncate">{user?.email}</p>
                <div className="mt-1">
                  <span className="text-[10px] px-2 py-0.5 bg-white/20 rounded-full text-white/90 uppercase font-semibold">
                    {user?.role || 'Invitado'}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-red-200 hover:text-white transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ====== MAIN CONTENT ====== */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>

              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-gray-100 rounded-lg"
              >
                <Calendar className="w-5 h-5 text-gray-600" />
              </Button>

              {/* ── CAMPANA DE NOTIFICACIONES ── */}
              <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    {noLeidas > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-[10px] font-bold px-1">
                          {noLeidas > 9 ? '9+' : noLeidas}
                        </span>
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-96 p-0 shadow-xl">
                  {/* Header del dropdown */}
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50 rounded-t-lg">
                    <div>
                      <p className="font-semibold text-gray-900">Notificaciones</p>
                      {noLeidas > 0 ? (
                        <p className="text-xs text-gray-500">{noLeidas} sin leer</p>
                      ) : (
                        <p className="text-xs text-gray-400">Todo al día</p>
                      )}
                    </div>
                    {noLeidas > 0 && (
                      <button
                        onClick={handleMarcarTodas}
                        className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Marcar todas
                      </button>
                    )}
                  </div>

                  {/* Lista */}
                  <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
                    {notificaciones.length === 0 ? (
                      <div className="py-10 text-center">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Bell className="w-6 h-6 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">Sin notificaciones</p>
                        <p className="text-xs text-gray-400 mt-1">Te avisaremos cuando haya novedades</p>
                      </div>
                    ) : (
                      notificaciones.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleMarcarLeida(n.id, n.negociacionId)}
                          className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                            !n.leida ? 'bg-red-50/40' : 'bg-white'
                          }`}
                        >
                          {/* Icono */}
                          <div
                            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-base ${notifBg(n.tipo)}`}
                          >
                            {notifIcon(n.tipo)}
                          </div>

                          {/* Contenido */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${
                                !n.leida
                                  ? 'font-semibold text-gray-900'
                                  : 'font-medium text-gray-700'
                              }`}
                            >
                              {n.titulo}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {n.mensaje}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {new Date(n.createdAt).toLocaleDateString('es-CO', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>

                          {/* Punto no leída */}
                          {!n.leida && (
                            <div className="flex-shrink-0 mt-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full" />
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {notificaciones.length > 0 && (
                    <div className="px-4 py-2.5 border-t bg-gray-50 rounded-b-lg">
                      <button
                        onClick={() => {
                          setBellOpen(false);
                          router.push('/dashboard/envios');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium w-full text-center transition-colors"
                      >
                        Ver todos los envíos y negociaciones →
                      </button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="hidden sm:block h-8 w-px bg-gray-200" />

              <Avatar className="w-9 h-9 cursor-pointer border-2 border-gray-200 hover:border-red-500 transition-colors">
                <AvatarImage src="" />
                <AvatarFallback className="bg-red-100 text-red-600 font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}