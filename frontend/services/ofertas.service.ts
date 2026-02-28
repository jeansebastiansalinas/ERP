import { getCookie } from '@/lib/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// 📖 Tipos que reflejan exactamente lo que devuelve el backend
export interface OfertaVenta {
  id: string;
  tipoProducto: 'DIESEL' | 'GASOLINA_CORRIENTE' | 'GASOLINA_EXTRA' | 'JET_FUEL' | 'GLP';
  cantidad: number;
  precioUnitario: number;
  ubicacion: string;
  pais: string;
  ciudad: string;
  fechaDisponible: string;
  fechaExpiracion?: string;
  descripcion?: string;
  incluyeFlete: boolean;
  radioEntrega?: number;
  estado: 'ACTIVA' | 'PAUSADA' | 'VENDIDA' | 'EXPIRADA';
  vendedorId: number;
  vendedor: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface CreateOfertaData {
  tipoProducto: string;
  cantidad: number;
  precioUnitario: number;
  ubicacion: string;
  pais: string;
  ciudad: string;
  fechaDisponible: string;
  fechaExpiracion?: string;
  descripcion?: string;
  incluyeFlete?: boolean;
  radioEntrega?: number;
}

// 📖 Función helper para obtener headers con el token
function getAuthHeaders(): HeadersInit {
  const token = getCookie('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ════════════════════════════════════════════════
// GET /api/ofertas — Listar todas las ofertas activas
// ════════════════════════════════════════════════
export async function getOfertas(filters?: {
  tipoProducto?: string;
  ciudad?: string;
  precioMaximo?: number;
}): Promise<OfertaVenta[]> {
  const params = new URLSearchParams();
  if (filters?.tipoProducto) params.append('tipoProducto', filters.tipoProducto);
  if (filters?.ciudad) params.append('ciudad', filters.ciudad);
  if (filters?.precioMaximo) params.append('precioMaximo', String(filters.precioMaximo));

  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_URL}/ofertas${query}`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Error al obtener ofertas');
  return res.json();
}

// ════════════════════════════════════════════════
// GET /api/ofertas/mis-ofertas — Mis ofertas (vendedor)
// ════════════════════════════════════════════════
export async function getMisOfertas(): Promise<OfertaVenta[]> {
  const res = await fetch(`${API_URL}/ofertas/mis-ofertas`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Error al obtener tus ofertas');
  return res.json();
}

// ════════════════════════════════════════════════
// POST /api/ofertas — Crear oferta
// ════════════════════════════════════════════════
export async function createOferta(data: CreateOfertaData): Promise<OfertaVenta> {
  const res = await fetch(`${API_URL}/ofertas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al crear oferta');
  }
  return res.json();
}

// ════════════════════════════════════════════════
// DELETE /api/ofertas/:id — Eliminar oferta
// ════════════════════════════════════════════════
export async function deleteOferta(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/ofertas/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!res.ok) throw new Error('Error al eliminar oferta');
}