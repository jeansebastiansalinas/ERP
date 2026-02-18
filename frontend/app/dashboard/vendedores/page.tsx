'use client';

import { 
  Users, 
  TrendingUp, 
  Award,
  Phone,
  Mail,
  MapPin,
  Package,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function VendedoresPage() {
  const vendedores = [
    {
      id: 1,
      nombre: 'Ana Torres',
      email: 'ana@erp.com',
      telefono: '+57 310 123 4567',
      zona: 'Bogotá',
      clientes: 45,
      ventas: '$125,000',
      rating: 4.8,
      estado: 'Activo',
    },
    {
      id: 2,
      nombre: 'Carlos Méndez',
      email: 'carlos@erp.com',
      telefono: '+57 315 234 5678',
      zona: 'Medellín',
      clientes: 38,
      ventas: '$98,000',
      rating: 4.6,
      estado: 'Activo',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vendedores</h1>
        <p className="text-gray-600 mt-1">
          Gestiona tu equipo de ventas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Vendedores</p>
                <p className="text-3xl font-bold text-gray-900">24</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ventas Totales</p>
                <p className="text-3xl font-bold text-gray-900">$2.4M</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rating Promedio</p>
                <p className="text-3xl font-bold text-gray-900">4.7</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de vendedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vendedores.map((vendedor) => (
          <Card key={vendedor.id} className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white font-bold text-lg">
                    {vendedor.nombre.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {vendedor.nombre}
                      </h3>
                      <Badge className="mt-1 bg-green-100 text-green-700">
                        {vendedor.estado}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Rating</p>
                      <div className="flex items-center gap-1">
                        <span className="text-xl font-bold text-yellow-500">
                          ⭐ {vendedor.rating}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {vendedor.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {vendedor.telefono}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {vendedor.zona}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Clientes</p>
                      <p className="text-lg font-bold text-gray-900">
                        {vendedor.clientes}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Ventas</p>
                      <p className="text-lg font-bold text-gray-900">
                        {vendedor.ventas}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}