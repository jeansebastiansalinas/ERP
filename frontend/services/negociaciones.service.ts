// src/services/negociaciones.service.ts
// Usa el mismo cliente axios que el resto del proyecto (src/lib/api.ts)

import { api } from '@/lib/api';
import { getCookie } from '@/lib/cookies';

// ── Helper: inyectar token en headers ────────────────────────────────────────

function authConfig() {
  const token = getCookie('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type EstadoNegociacion =
  | 'ESPERANDO_CONFIRMACION'
  | 'CONFIRMADA'
  | 'RECHAZADA'
  | 'CANCELADA'
  | 'COMPLETADA';

export type EstadoEnvio =
  | 'PENDIENTE'
  | 'PAGADO'
  | 'EN_PREPARACION'
  | 'EN_TRANSITO'
  | 'ENTREGADO'
  | 'CANCELADO';

export type EstadoPago =
  | 'PENDIENTE'
  | 'COMPROBANTE_SUBIDO'
  | 'VERIFICANDO'
  | 'CONFIRMADO'
  | 'RECHAZADO';

export interface Envio {
  id: string;
  origen: string;
  destino: string;
  conductorNombre?: string;
  conductorTelefono?: string;
  vehiculoPlaca?: string;
  estadoEnvio: EstadoEnvio;
  progresoEstimado?: number;
  fechaSalida?: string;
  fechaEntregaEst?: string;
  fechaEntregaReal?: string;
  observaciones?: string;
}

export interface Factura {
  id: string;
  subtotal: number;
  costoFlete: number;
  comisionPlataforma: number;
  total: number;
  estadoPago: EstadoPago;
  metodoPago?: string;
  comprobanteURL?: string;
  fondosLiberados: boolean;
}

export interface Negociacion {
  id: string;
  estado: EstadoNegociacion;
  tipoProducto: string;
  cantidad: number;
  precioUnitario: number;
  incluyeFlete: boolean;
  costoFlete?: number;
  ciudad: string;
  pais: string;
  direccionEntrega: string;
  notasVendedor?: string;
  notasComprador?: string;
  createdAt: string;
  updatedAt: string;
  vendedor: { id: number; name: string; email: string };
  comprador: { id: number; name: string; email: string };
  oferta?: any;
  solicitud?: any;
  envio?: Envio;
  factura?: Factura;
}

export interface CreateNegociacionData {
  vendedorId: number;
  compradorId: number;
  ofertaId?: string;
  solicitudId?: string;
  tipoProducto: string;
  cantidad: number;
  precioUnitario: number;
  incluyeFlete: boolean;
  costoFlete?: number;
  direccionEntrega: string;
  ciudad: string;
  pais: string;
  notasComprador?: string;
}

// ── POST /api/negociaciones ───────────────────────────────────────────────────

export async function createNegociacion(data: CreateNegociacionData): Promise<Negociacion> {
  try {
    const { data: res } = await api.post<Negociacion>('/negociaciones', data, authConfig());
    return res;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al crear negociación');
  }
}

// ── GET /api/negociaciones/mis ────────────────────────────────────────────────

export async function getMisNegociaciones(): Promise<Negociacion[]> {
  try {
    const { data } = await api.get<Negociacion[]>('/negociaciones/mis', authConfig());
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al cargar negociaciones');
  }
}

// ── PATCH /api/negociaciones/:id/aceptar ─────────────────────────────────────

export async function aceptarNegociacion(id: string, notasVendedor?: string): Promise<Negociacion> {
  try {
    const { data } = await api.patch<Negociacion>(
      `/negociaciones/${id}/aceptar`,
      { notasVendedor },
      authConfig(),
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al aceptar negociación');
  }
}

// ── PATCH /api/negociaciones/:id/rechazar ────────────────────────────────────

export async function rechazarNegociacion(id: string, motivo?: string): Promise<Negociacion> {
  try {
    const { data } = await api.patch<Negociacion>(
      `/negociaciones/${id}/rechazar`,
      { motivo },
      authConfig(),
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al rechazar negociación');
  }
}

// ── PATCH /api/negociaciones/:id/cancelar ────────────────────────────────────

export async function cancelarNegociacion(id: string, motivo?: string): Promise<Negociacion> {
  try {
    const { data } = await api.patch<Negociacion>(
      `/negociaciones/${id}/cancelar`,
      { motivo },
      authConfig(),
    );
    return data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Error al cancelar negociación');
  }
}