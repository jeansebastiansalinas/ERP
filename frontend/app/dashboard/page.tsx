'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnboarding } from '@/hooks/useOnboarding';
import Preloader from '@/components/onboarding/Preloader';
import WelcomeModal from '@/components/onboarding/WelcomeModal';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Clock,
  MapPin,
  CheckCircle,
  Zap,
  Award,
  ChevronRight,
  Filter,
  Download,
  Navigation,
  Fuel,
  AlertTriangle,
  CheckCheck,
  Timer,
  Package,
  Truck,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const { isLoading, showWelcome, handlePreloaderComplete, completeWelcome } = useOnboarding(user?.email);
  const [dashboardVisible, setDashboardVisible] = useState(false);

  // 📖 Activar dashboard cuando NO esté cargando
  useEffect(() => {
    if (!isLoading) {
      setDashboardVisible(true);
    }
  }, [isLoading]);

  // 📊 Datos para los gráficos de Recharts
  const monthlyData = [
    { name: 'Ene', envios: 186, ingresos: 28000, entregas: 174 },
    { name: 'Feb', envios: 305, ingresos: 42000, entregas: 298 },
    { name: 'Mar', envios: 237, ingresos: 35000, entregas: 229 },
    { name: 'Abr', envios: 273, ingresos: 39000, entregas: 267 },
    { name: 'May', envios: 209, ingresos: 31000, entregas: 205 },
    { name: 'Jun', envios: 314, ingresos: 45000, entregas: 308 },
    { name: 'Jul', envios: 285, ingresos: 41000, entregas: 279 },
  ];

  const fleetPerformance = [
    { vehicle: 'VH-001', efficiency: 92, trips: 45, status: 'Excelente' },
    { vehicle: 'VH-002', efficiency: 88, trips: 38, status: 'Bueno' },
    { vehicle: 'VH-003', efficiency: 95, trips: 52, status: 'Excelente' },
    { vehicle: 'VH-004', efficiency: 78, trips: 28, status: 'Regular' },
    { vehicle: 'VH-005', efficiency: 90, trips: 41, status: 'Bueno' },
  ];

  const deliveryStatus = [
    { name: 'Entregado', value: 784, color: '#10b981' },
    { name: 'En tránsito', value: 156, color: '#3b82f6' },
    { name: 'Pendiente', value: 89, color: '#f59e0b' },
    { name: 'Retrasado', value: 24, color: '#ef4444' },
  ];

  const revenueData = [
    { month: 'Ene', revenue: 28000 },
    { month: 'Feb', revenue: 42000 },
    { month: 'Mar', revenue: 35000 },
    { month: 'Abr', revenue: 39000 },
    { month: 'May', revenue: 31000 },
    { month: 'Jun', revenue: 45000 },
    { month: 'Jul', revenue: 41000 },
  ];

  // 📈 Métricas principales
  const metrics = [
    {
      title: 'Envíos Totales',
      value: '2,543',
      change: '+12.5%',
      trend: 'up',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-500',
      lightBg: 'bg-blue-50',
      description: 'vs. mes anterior',
    },
    {
      title: 'Ingresos del Mes',
      value: '$45,231',
      change: '+8.2%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-500',
      lightBg: 'bg-green-50',
      description: 'vs. mes anterior',
    },
    {
      title: 'Flota Activa',
      value: '127/135',
      change: '94%',
      trend: 'up',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-500',
      lightBg: 'bg-purple-50',
      description: 'disponibilidad',
    },
    {
      title: 'Tasa de Entrega',
      value: '98.5%',
      change: '+1.2%',
      trend: 'up',
      icon: Activity,
      color: 'text-red-600',
      bgColor: 'bg-red-500',
      lightBg: 'bg-red-50',
      description: 'eficiencia',
    },
  ];

  // 🚚 Envíos en tiempo real
  const liveShipments = [
    {
      id: 'SHP-2024-001',
      client: 'Almacenes García',
      origin: 'Popayán',
      destination: 'Bogotá',
      driver: 'Carlos Méndez',
      vehicle: 'VH-023',
      progress: 65,
      status: 'En tránsito',
      statusColor: 'bg-blue-500',
      eta: '2 horas',
      distance: '342 km',
    },
    {
      id: 'SHP-2024-002',
      client: 'Distribuidora López',
      origin: 'Cali',
      destination: 'Medellín',
      driver: 'Ana Torres',
      vehicle: 'VH-015',
      progress: 100,
      status: 'Entregado',
      statusColor: 'bg-green-500',
      eta: 'Completado',
      distance: '415 km',
    },
    {
      id: 'SHP-2024-003',
      client: 'Comercial Ramírez',
      origin: 'Pasto',
      destination: 'Cali',
      driver: 'Luis Gómez',
      vehicle: 'VH-041',
      progress: 35,
      status: 'En tránsito',
      statusColor: 'bg-blue-500',
      eta: '4 horas',
      distance: '287 km',
    },
  ];



  

  // 🏆 Top performers
  const topDrivers = [
    { name: 'Carlos Méndez', trips: 52, rating: 4.9, avatar: 'CM' },
    { name: 'Ana Torres', trips: 48, rating: 4.8, avatar: 'AT' },
    { name: 'Luis Gómez', trips: 45, rating: 4.7, avatar: 'LG' },
  ];

  if (isLoading) {
    return <Preloader onComplete={handlePreloaderComplete} />;
  }

  return (
    <>
      {showWelcome && (
        <WelcomeModal 
          userName={user?.name?.split(' ')[0] || 'Usuario'} 
          onClose={completeWelcome}
        />
      )}

      <div className={`space-y-8 transition-all duration-700 ${dashboardVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Welcome Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido de vuelta, {user?.name?.split(' ')[0] || 'Usuario'}! 👋
            </h2>
            <p className="text-gray-600">
              Aquí está el resumen de tu operación logística en tiempo real
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2 border-2 hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/30">
              <Download className="w-4 h-4" />
              Exportar Reporte
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <Card
              key={index}
              className="relative border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 overflow-hidden group"
            >
              <div className={`absolute inset-0 ${metric.bgColor} opacity-0 group-hover:opacity-5 transition-opacity`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.lightBg}`}>
                  <metric.icon className={`w-5 h-5 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-3xl font-bold text-gray-900">
                    {metric.value}
                  </p>
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex items-center gap-1.5 text-sm font-semibold ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {metric.trend === 'up' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span>{metric.change}</span>
                    </div>
                    <p className="text-xs text-gray-500">{metric.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white border shadow-sm p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Vista General
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Análisis Detallado
            </TabsTrigger>
            <TabsTrigger value="fleet" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
              Rendimiento Flota
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Line Chart - Envíos y Entregas */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-xl">Envíos Mensuales</span>
                    <Badge className="bg-blue-100 text-blue-700">Últimos 7 meses</Badge>
                  </CardTitle>
                  <CardDescription>Comparativa de envíos vs entregas exitosas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="envios"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="entregas"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ fill: '#10b981', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Area Chart - Ingresos */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-xl">Ingresos</span>
                    <Badge className="bg-green-100 text-green-700">+8.2% vs mes anterior</Badge>
                  </CardTitle>
                  <CardDescription>Evolución de ingresos mensuales</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                        formatter={(value) => `$${value.toLocaleString()}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart - Estado de Entregas */}
              <Card className="border-0 shadow-xl lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-xl">Estado de Entregas</CardTitle>
                  <CardDescription>Distribución actual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={deliveryStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {deliveryStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {deliveryStatus.map((status, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: status.color }}
                          />
                          <span className="text-slate-600">{status.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{status.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Live Shipments Tracking */}
              <Card className="border-0 shadow-xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Navigation className="w-5 h-5 text-red-500" />
                    Seguimiento en Tiempo Real
                  </CardTitle>
                  <CardDescription>Envíos activos con ubicación GPS</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {liveShipments.map((shipment, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-200 hover:border-red-300 transition-all hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-slate-900">{shipment.id}</p>
                            <p className="text-sm text-slate-600">{shipment.client}</p>
                          </div>
                          <Badge className={`${shipment.statusColor} text-white`}>
                            {shipment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                          <MapPin className="w-3 h-3" />
                          <span>{shipment.origin}</span>
                          <ChevronRight className="w-3 h-3" />
                          <span>{shipment.destination}</span>
                          <span className="ml-auto">·</span>
                          <span>{shipment.distance}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Progreso del viaje</span>
                            <span className="font-semibold text-slate-900">
                              {shipment.progress}%
                            </span>
                          </div>
                          <Progress value={shipment.progress} className="h-2" />
                        </div>
                        <div className="flex items-center justify-between mt-3 text-xs">
                          <span className="text-slate-600">
                            Conductor: <span className="font-medium text-slate-900">{shipment.driver}</span>
                          </span>
                          <span className="text-slate-600">
                            ETA: <span className="font-medium text-slate-900">{shipment.eta}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bar Chart - Rendimiento de Flota */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl">Eficiencia de Vehículos</CardTitle>
                  <CardDescription>Top 5 vehículos por rendimiento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={fleetPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="vehicle" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="efficiency"
                        fill="#8b5cf6"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="trips"
                        fill="#3b82f6"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Top Drivers */}
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Conductores Destacados
                  </CardTitle>
                  <CardDescription>Mejor desempeño del mes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topDrivers.map((driver, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-white rounded-xl border border-yellow-200"
                      >
                        <div className="relative">
                          <Avatar className="w-14 h-14 border-2 border-yellow-400">
                            <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white font-bold">
                              {driver.avatar}
                            </AvatarFallback>
                          </Avatar>
                          {index === 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                              <Award className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900">{driver.name}</p>
                          <p className="text-sm text-slate-600">{driver.trips} viajes completados</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(driver.rating)
                                    ? 'text-yellow-400 fill-current'
                                    : 'text-slate-300'
                                }`}
                                viewBox="0 0 20 20"
                              >
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                              </svg>
                            ))}
                          </div>
                          <p className="text-sm font-semibold text-slate-900 mt-1">
                            {driver.rating}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="fleet" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCheck className="w-5 h-5 text-green-600" />
                    Operativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-bold text-green-600">127</p>
                  <p className="text-slate-600 mt-2">Vehículos activos</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Timer className="w-5 h-5 text-yellow-600" />
                    En Mantenimiento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-bold text-yellow-600">5</p>
                  <p className="text-slate-600 mt-2">Programado</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-gradient-to-br from-red-50 to-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    Fuera de Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-5xl font-bold text-red-600">3</p>
                  <p className="text-slate-600 mt-2">Requiere atención</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Zap className="w-6 h-6 text-yellow-400" />
              Acciones Rápidas
            </CardTitle>
            <CardDescription className="text-slate-300">
              Accede a las funciones más utilizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-24 flex-col gap-2 bg-white/10 hover:bg-white/20 border border-white/20">
                <Package className="w-8 h-8" />
                <span>Nuevo Envío</span>
              </Button>
              <Button className="h-24 flex-col gap-2 bg-white/10 hover:bg-white/20 border border-white/20">
                <Truck className="w-8 h-8" />
                <span>Asignar Vehículo</span>
              </Button>
              <Button className="h-24 flex-col gap-2 bg-white/10 hover:bg-white/20 border border-white/20">
                <Package className="w-8 h-8" />
                <span>Ver Envíos</span>
              </Button>
              <Button className="h-24 flex-col gap-2 bg-white/10 hover:bg-white/20 border border-white/20">
                <Activity className="w-8 h-8" />
                <span>Generar Reporte</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}