'use client';

import { ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardLayoutProps {
  children: ReactNode; // 📖 El contenido de cada página irá aquí
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    signOut();
    router.push('/login');
  };

  // 📖 Menú con roles
  const menuItems = [
    { 
      icon: Home, 
      label: 'Dashboard', 
      href: '/dashboard', 
      roles: ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN']
    },
    { 
      icon: Users, 
      label: 'Clientes', 
      href: '/dashboard/clientes', 
      roles: ['ADMIN', 'VENDEDOR', 'SUPER_ADMIN']
    },
    { 
      icon: UserCircle, 
      label: 'Vendedores', 
      href: '/dashboard/vendedores', 
      roles: ['ADMIN', 'COMPRADOR', 'SUPER_ADMIN']
    },
    { 
      icon: Package, 
      label: 'Envíos', 
      href: '/dashboard/envios', 
      roles: ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN']
    },
    { 
      icon: BarChart3, 
      label: 'Reportes', 
      href: '/dashboard/reportes', 
      roles: ['ADMIN', 'VENDEDOR', 'COMPRADOR', 'SUPER_ADMIN']
    },
    { 
      icon: Settings, 
      label: 'Configuración', 
      href: '/dashboard/configuracion', 
      roles: ['ADMIN', 'SUPER_ADMIN']
    },
  ];

  // 📖 Filtrar menú por rol
  const userRole = user?.role || 'COMPRADOR';
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  // 📖 Verificar si la ruta actual está activa
  const isActive = (href: string) => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === href;
    }
    return false;
  };

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
            {filteredMenuItems.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-white/20 text-white shadow-lg'
                    : 'text-red-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
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

      {/* Overlay */}
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
              <Button variant="ghost" size="icon" className="relative hover:bg-gray-100 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="p-4">
                    <p className="text-sm text-gray-500">No hay notificaciones</p>
                  </div>
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

        {/* 📖 AQUÍ SE RENDERIZA EL CONTENIDO DE CADA PÁGINA */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}