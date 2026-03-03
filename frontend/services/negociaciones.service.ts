// src/services/negociaciones.service.ts

import { api } from '@/lib/api';
import { getCookie } from '@/lib/cookies';

function authConfig() {
  const token = getCookie('token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type EstadoNegociacion =
  | 'ESPERANDO_CONFIRMACION' | 'CONFIRMADA'
  | 'RECHAZADA' | 'CANCELADA' | 'COMPLETADA';

export type EstadoEnvio =
  | 'PENDIENTE' | 'PAGADO' | 'EN_PREPARACION'
  | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';

export type EstadoPago =
  | 'PENDIENTE' | 'COMPROBANTE_SUBIDO' | 'VERIFICANDO'
  | 'CONFIRMADO' | 'RECHAZADO';

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
  fechaLiberacion?: string;
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
  // ← Clave para saber quién inició la negociación
  ofertaId?: string | null;
  solicitudId?: string | null;
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

// ── Helpers de error ──────────────────────────────────────────────────────────

function extractError(e: any, fallback: string): never {
  const msg = e?.response?.data?.message;
  throw new Error(Array.isArray(msg) ? msg.join(', ') : msg || fallback);
}

// ── CRUD ──────────────────────────────────────────────────────────────────────

export async function createNegociacion(data: CreateNegociacionData): Promise<Negociacion> {
  try {
    const { data: res } = await api.post<Negociacion>('/negociaciones', data, authConfig());
    return res;
  } catch (e: any) { extractError(e, 'Error al crear negociación'); }
}

export async function getMisNegociaciones(): Promise<Negociacion[]> {
  try {
    const { data } = await api.get<Negociacion[]>('/negociaciones/mis', authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al cargar negociaciones'); }
}

// ── GET todas (Admin) ────────────────────────────────────────────────────────

export async function getAllNegociaciones(): Promise<Negociacion[]> {
  try {
    const { data } = await api.get<Negociacion[]>('/negociaciones', authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al cargar negociaciones'); }
}

// ── Cambiar estado del envío (Admin) ─────────────────────────────────────────

export async function cambiarEstadoEnvio(envioId: string, data: {
  estadoEnvio: string;
  conductorNombre?: string;
  conductorTelefono?: string;
  vehiculoPlaca?: string;
  observaciones?: string;
}): Promise<any> {
  try {
    const { data: res } = await api.patch(`/envios/${envioId}/estado`, data, authConfig());
    return res;
  } catch (e: any) { extractError(e, 'Error al cambiar estado del envío'); }
}

// ── Acciones del flujo ────────────────────────────────────────────────────────

export async function aceptarNegociacion(id: string, notasVendedor?: string): Promise<Negociacion> {
  try {
    const { data } = await api.patch<Negociacion>(`/negociaciones/${id}/aceptar`, { notasVendedor }, authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al aceptar negociación'); }
}

export async function rechazarNegociacion(id: string, motivo?: string): Promise<Negociacion> {
  try {
    const { data } = await api.patch<Negociacion>(`/negociaciones/${id}/rechazar`, { motivo }, authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al rechazar negociación'); }
}

export async function cancelarNegociacion(id: string, motivo?: string): Promise<Negociacion> {
  try {
    const { data } = await api.patch<Negociacion>(`/negociaciones/${id}/cancelar`, { motivo }, authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al cancelar negociación'); }
}

// ── Pago ──────────────────────────────────────────────────────────────────────

export async function subirComprobante(
  id: string, comprobanteURL: string, metodoPago: string,
): Promise<Factura> {
  try {
    const { data } = await api.patch<Factura>(
      `/negociaciones/${id}/comprobante`,
      { comprobanteURL, metodoPago },
      authConfig(),
    );
    return data;
  } catch (e: any) { extractError(e, 'Error al subir comprobante'); }
}

export async function confirmarPago(id: string): Promise<Factura> {
  try {
    const { data } = await api.patch<Factura>(`/negociaciones/${id}/confirmar-pago`, {}, authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al confirmar pago'); }
}

export async function rechazarPago(id: string, motivo?: string): Promise<Factura> {
  try {
    const { data } = await api.patch<Factura>(`/negociaciones/${id}/rechazar-pago`, { motivo }, authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al rechazar pago'); }
}

export async function liberarFondos(id: string): Promise<Factura> {
  try {
    const { data } = await api.patch<Factura>(`/negociaciones/${id}/liberar-fondos`, {}, authConfig());
    return data;
  } catch (e: any) { extractError(e, 'Error al liberar fondos'); }
}