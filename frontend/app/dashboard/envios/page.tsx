'use client';

import { useState } from 'react';
import { 
  Package, 
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  TrendingUp,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function EnviosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // 📊 Estadísticas
  const stats = [
    {
      title: 'Envíos Totales',
      value: '2,543',
      change: '+12.5%',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'En Tránsito',
      value: '156',
      change: 'Activos',
      icon: Truck,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Entregados',
      value: '2,311',
      change: '90.9%',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pendientes',
      value: '76',
      change: '3.0%',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  // 🚚 Envíos de ejemplo
  const envios = [
    {
      id: 'ENV-2024-001',
      cliente: 'Almacenes García',
      origen: 'Popayán',
      destino: 'Bogotá',
      conductor: 'Carlos Méndez',
      vehiculo: 'VH-023',
      estado: 'En tránsito',
      estadoColor: 'bg-blue-500',
      progreso: 65,
      fechaEnvio: '2024-02-15',
      fechaEstimada: '2024-02-16',
      peso: '450 kg',
      tipo: 'Estándar',
    },
    {
      id: 'ENV-2024-002',
      cliente: 'Distribuidora López',
      origen: 'Cali',
      destino: 'Medellín',
      conductor: 'Ana Torres',
      vehiculo: 'VH-015',
      estado: 'Entregado',
      estadoColor: 'bg-green-500',
      progreso: 100,
      fechaEnvio: '2024-02-14',
      fechaEstimada: '2024-02-15',
      peso: '320 kg',
      tipo: 'Express',
    },
    {
      id: 'ENV-2024-003',
      cliente: 'Comercial Ramírez',
      origen: 'Pasto',
      destino: 'Cali',
      conductor: 'Luis Gómez',
      vehiculo: 'VH-041',
      estado: 'Pendiente',
      estadoColor: 'bg-yellow-500',
      progreso: 0,
      fechaEnvio: '2024-02-16',
      fechaEstimada: '2024-02-17',
      peso: '280 kg',
      tipo: 'Estándar',
    },
    {
      id: 'ENV-2024-004',
      cliente: 'Tiendas El Sol',
      origen: 'Bogotá',
      destino: 'Barranquilla',
      conductor: 'María Rodríguez',
      vehiculo: 'VH-008',
      estado: 'En tránsito',
      estadoColor: 'bg-blue-500',
      progreso: 45,
      fechaEnvio: '2024-02-15',
      fechaEstimada: '2024-02-17',
      peso: '580 kg',
      tipo: 'Estándar',
    },
  ];

  // Filtrar por estado
  const enviosPorEstado = {
    todos: envios,
    enTransito: envios.filter(e => e.estado === 'En tránsito'),
    entregados: envios.filter(e => e.estado === 'Entregado'),
    pendientes: envios.filter(e => e.estado === 'Pendiente'),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Envíos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona y realiza seguimiento de todos tus envíos
          </p>
        </div>
        <Button className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
          <Package className="w-4 h-4" />
          Nuevo Envío
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
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
              <Input
                type="search"
                placeholder="Buscar por ID, cliente, conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Fecha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs por estado */}
      <Tabs defaultValue="todos" className="space-y-6">
        <TabsList className="bg-white border shadow-sm p-1">
          <TabsTrigger value="todos">
            Todos ({enviosPorEstado.todos.length})
          </TabsTrigger>
          <TabsTrigger value="enTransito">
            En Tránsito ({enviosPorEstado.enTransito.length})
          </TabsTrigger>
          <TabsTrigger value="entregados">
            Entregados ({enviosPorEstado.entregados.length})
          </TabsTrigger>
          <TabsTrigger value="pendientes">
            Pendientes ({enviosPorEstado.pendientes.length})
          </TabsTrigger>
        </TabsList>

        {/* Lista de envíos */}
        {Object.entries(enviosPorEstado).map(([key, lista]) => (
          <TabsContent key={key} value={key} className="space-y-4">
            {lista.map((envio) => (
              <Card key={envio.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    {/* Info principal */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {envio.id}
                          </h3>
                          <p className="text-sm text-gray-600">{envio.cliente}</p>
                        </div>
                        <Badge className={`${envio.estadoColor} text-white`}>
                          {envio.estado}
                        </Badge>
                      </div>

                      {/* Ruta */}
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{envio.origen}</span>
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-gray-300" />
                        <div className="flex items-center gap-2 text-gray-700">
                          <MapPin className="w-4 h-4 text-red-600" />
                          <span className="font-medium">{envio.destino}</span>
                        </div>
                      </div>

                      {/* Progreso */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progreso</span>
                          <span className="font-semibold text-gray-900">
                            {envio.progreso}%
                          </span>
                        </div>
                        <Progress value={envio.progreso} className="h-2" />
                      </div>

                      {/* Detalles */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Conductor</p>
                          <p className="font-semibold text-gray-900">
                            {envio.conductor}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Vehículo</p>
                          <p className="font-semibold text-gray-900">
                            {envio.vehiculo}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Peso</p>
                          <p className="font-semibold text-gray-900">
                            {envio.peso}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tipo</p>
                          <p className="font-semibold text-gray-900">
                            {envio.tipo}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fechas */}
                    <div className="lg:w-48 space-y-3 text-sm">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-xs">Fecha Envío</p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {new Date(envio.fechaEnvio).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-blue-600 text-xs">Entrega Estimada</p>
                        <p className="font-semibold text-blue-900 mt-1">
                          {new Date(envio.fechaEstimada).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}