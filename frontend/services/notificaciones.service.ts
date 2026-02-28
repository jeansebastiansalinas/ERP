// src/services/notificaciones.service.ts
// Usa el mismo cliente axios que el resto del proyecto (src/lib/api.ts)

import { api } from '@/lib/api';
import { getCookie } from '@/lib/cookies';

// ── Helper ────────────────────────────────────────────────────────────────────

function authConfig() {
  const token = getCookie('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type TipoNotificacion =
  | 'NUEVA_PROPUESTA'
  | 'PROPUESTA_ACEPTADA'
  | 'PROPUESTA_RECHAZADA';

export interface Notificacion {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  leida: boolean;
  negociacionId?: string;
  createdAt: string;
}

// ── GET /api/notificaciones/mis ───────────────────────────────────────────────

export async function getMisNotificaciones(): Promise<Notificacion[]> {
  try {
    const { data } = await api.get<Notificacion[]>('/notificaciones/mis', authConfig());
    return data;
  } catch {
    return []; // silencioso — no romper la UI
  }
}

// ── GET /api/notificaciones/no-leidas-count ───────────────────────────────────

export async function getNoLeidasCount(): Promise<number> {
  try {
    const { data } = await api.get<{ count: number }>('/notificaciones/no-leidas-count', authConfig());
    return data.count ?? 0;
  } catch {
    return 0;
  }
}

// ── PATCH /api/notificaciones/:id/leer ───────────────────────────────────────

export async function marcarLeida(id: string): Promise<void> {
  try {
    await api.patch(`/notificaciones/${id}/leer`, {}, authConfig());
  } catch {
    // silencioso
  }
}

// ── PATCH /api/notificaciones/leer-todas ─────────────────────────────────────

export async function marcarTodasLeidas(): Promise<void> {
  try {
    await api.patch('/notificaciones/leer-todas', {}, authConfig());
  } catch {
    // silencioso
  }
}