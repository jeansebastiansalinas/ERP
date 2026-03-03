// src/services/admin.service.ts
import { getCookie } from '@/lib/cookies';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getAuthHeaders(): HeadersInit {
  const token = getCookie('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: { name: string };
  _count: {
    ofertasVenta: number;
    solicitudesCompra: number;
    negociacionesVendedor: number;
    negociacionesComprador: number;
  };
}

export interface AdminStats {
  usuarios:      { total: number; vendedores: number; compradores: number };
  ofertas:       { total: number; activas: number };
  solicitudes:   { total: number; activas: number };
  negociaciones: { total: number; confirmadas: number };
}

export interface CreateUserData {
  email: string;
  password: string;
  name?: string;
  role: 'VENDEDOR' | 'COMPRADOR' | 'ADMIN' | 'SUPER_ADMIN';
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  password?: string;
}

// ── Stats ─────────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_URL}/users/stats`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener estadísticas');
  return res.json();
}

// ── Usuarios ──────────────────────────────────────────────────────────────────

export async function getAdminUsers(filters?: { role?: string; isActive?: boolean }): Promise<AdminUser[]> {
  const params = new URLSearchParams();
  if (filters?.role)              params.append('role', filters.role);
  if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
  const query = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_URL}/users${query}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener usuarios');
  return res.json();
}

export async function getAdminUser(id: number): Promise<any> {
  const res = await fetch(`${API_URL}/users/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener usuario');
  return res.json();
}

export async function createAdminUser(data: CreateUserData): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/users`, {
    method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al crear usuario');
  }
  return res.json();
}

export async function updateAdminUser(id: number, data: UpdateUserData): Promise<AdminUser> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH', headers: getAuthHeaders(), body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al actualizar usuario');
  }
  return res.json();
}

export async function deleteAdminUser(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Error al eliminar usuario');
  }
}

// ── Ofertas admin (reutiliza el endpoint existente) ───────────────────────────

export async function getAllOfertasAdmin(): Promise<any[]> {
  const res = await fetch(`${API_URL}/ofertas`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener ofertas');
  return res.json();
}

export async function deleteOfertaAdmin(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/ofertas/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar oferta');
}

// ── Solicitudes admin ─────────────────────────────────────────────────────────

export async function getAllSolicitudesAdmin(): Promise<any[]> {
  const res = await fetch(`${API_URL}/solicitudes`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener solicitudes');
  return res.json();
}

export async function deleteSolicitudAdmin(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/solicitudes/${id}`, {
    method: 'DELETE', headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al eliminar solicitud');
}