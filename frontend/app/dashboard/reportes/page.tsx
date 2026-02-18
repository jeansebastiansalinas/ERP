'use client';

import { 
  BarChart3, 
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Package,
  Truck,
  Users,
  FileText,
  PieChart,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ReportesPage() {
  // 📊 Datos para gráficos
  const ventasMensuales = [
    { mes: 'Ene', ventas: 45000, envios: 186 },
    { mes: 'Feb', ventas: 52000, envios: 205 },
    { mes: 'Mar', ventas: 48000, envios: 197 },
    { mes: 'Abr', ventas: 61000, envios: 243 },
    { mes: 'May', ventas: 55000, envios: 209 },
    { mes: 'Jun', ventas: 67000, envios: 278 },
  ];

  const topClientes = [
    { nombre: 'Almacenes García', ventas: 125000 },
    { nombre: 'Distribuidora López', ventas: 98000 },
    { nombre: 'Comercial Ramírez', ventas: 87000 },
    { nombre: 'Tiendas El Sol', ventas: 76000 },
    { nombre: 'Super Mercado Central', ventas: 65000 },
  ];

  const reportesDisponibles = [
    {
      titulo: 'Reporte de Ventas',
      descripcion: 'Ventas totales por mes y cliente',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      periodo: 'Último mes',
    },
    {
      titulo: 'Reporte de Envíos',
      descripcion: 'Estado y seguimiento de envíos',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      periodo: 'Último mes',
    },
    {
      titulo: 'Rendimiento de Flota',
      descripcion: 'Eficiencia y uso de vehículos',
      icon: Truck,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      periodo: 'Último mes',
    },
    {
      titulo: 'Análisis de Clientes',
      descripcion: 'Comportamiento y frecuencia',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      periodo: 'Último trimestre',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">
            Análisis y estadísticas de tu operación
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            Seleccionar Período
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
            <Download className="w-4 h-4" />
            Exportar Todo
          </Button>
        </div>
      </div>

      {/* Reportes disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportesDisponibles.map((reporte, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all cursor-pointer group">
            <CardContent className="p-6">
              <div className={`w-12 h-12 rounded-lg ${reporte.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <reporte.icon className={`w-6 h-6 ${reporte.color}`} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{reporte.titulo}</h3>
              <p className="text-sm text-gray-600 mb-3">{reporte.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{reporte.periodo}</span>
                <Button size="sm" variant="ghost" className="gap-2">
                  <Download className="w-3 h-3" />
                  Descargar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="ventas" className="space-y-6">
        <TabsList className="bg-white border shadow-sm p-1">
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="clientes">Top Clientes</TabsTrigger>
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="ventas">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Evolución de Ventas y Envíos
              </CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="mes" stroke="#64748b" />
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
                    dataKey="ventas"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    name="Ventas ($)"
                  />
                  <Line
                    type="monotone"
                    dataKey="envios"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    name="Envíos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                Top 5 Clientes por Ventas
              </CardTitle>
              <CardDescription>Último mes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topClientes} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" stroke="#64748b" />
                  <YAxis dataKey="nombre" type="category" stroke="#64748b" width={150} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  formatter={(value) => `$${Number(value ?? 0).toLocaleString()}`}                 />
                  <Bar
                    dataKey="ventas"
                    fill="#3b82f6"
                    radius={[0, 8, 8, 0]}
                    name="Ventas"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rendimiento">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Métricas de Rendimiento</CardTitle>
              <CardDescription>Indicadores clave del último mes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gradient-to-br from-green-50 to-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Tasa de Entrega</p>
                  <p className="text-4xl font-bold text-green-600">98.5%</p>
                  <p className="text-sm text-green-600 mt-2">+2.3% vs mes anterior</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Tiempo Promedio</p>
                  <p className="text-4xl font-bold text-blue-600">2.4 días</p>
                  <p className="text-sm text-blue-600 mt-2">-0.5 días vs mes anterior</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-white rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Satisfacción</p>
                  <p className="text-4xl font-bold text-purple-600">4.8/5</p>
                  <p className="text-sm text-purple-600 mt-2">+0.2 vs mes anterior</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}