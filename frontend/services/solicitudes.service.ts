import { getCookie } from '@/lib/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export interface SolicitudCompra {
  id: string;
  tipoProducto: 'DIESEL' | 'GASOLINA_CORRIENTE' | 'GASOLINA_EXTRA' | 'JET_FUEL' | 'GLP';
  cantidadRequerida: number;
  precioMaximo: number;
  pais: string;
  ciudad: string;
  direccionEntrega: string;
  fechaRequerida: string;
  fechaExpiracion?: string;
  descripcion?: string;
  estado: 'ACTIVA' | 'PAUSADA' | 'VENDIDA' | 'EXPIRADA';
  compradorId: number;
  comprador: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface CreateSolicitudData {
  tipoProducto: string;
  cantidadRequerida: number;
  precioMaximo: number;
  pais: string;
  ciudad: string;
  direccionEntrega: string;
  fechaRequerida: string;
  fechaExpiracion?: string;
  descripcion?: string;
}

function getAuthHeaders(): HeadersInit {
  const token = getCookie('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// GET /api/solicitudes
export async function getSolicitudes(filters?: {
  tipoProducto?: string;
  ciudad?: string;
}): Promise<SolicitudCompra[]> {
  const params = new URLSearchParams();
  if (filters?.tipoProducto) params.append('tipoProducto', filters.tipoProducto);
  if (filters?.ciudad) params.append('ciudad', filters.ciudad);
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_URL}/solicitudes${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener solicitudes');
  return res.json();
}

// POST /api/solicitudes
export async function createSolicitud(data: CreateSolicitudData): Promise<SolicitudCompra> {
  const res = await fetch(`${API_URL}/solicitudes`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Error al crear solicitud');
  }
  return res.json();
}

// DELETE /api/solicitudes/:id
export async function deleteSolicitud(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/solicitudes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar solicitud');
}