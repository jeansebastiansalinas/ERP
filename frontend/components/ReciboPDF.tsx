// src/components/ReciboPDF.tsx
// Genera y descarga un PDF de recibo de envío usando jsPDF
// Instalar: npm install jspdf
// USO: <ReciboPDF negociacion={n} disabled={yaDescargo} />

'use client';

import { useState } from 'react';
import { FileText, Download, Loader2, CheckCircle } from 'lucide-react';
import type { Negociacion } from '@/services/negociaciones.service';

interface Props {
  negociacion: Negociacion;
  disabled?: boolean; // true si ya se generó el PDF una vez
}

// Número de recibo formateado
function nroRecibo(id: string): string {
  const nums = id.replace(/-/g, '').replace(/[^0-9]/g, '').slice(0, 6);
  return `REC-${nums.toUpperCase().padStart(6, '0')}`;
}

function formatCOP(valor: number): string {
  return `$${valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatFecha(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function ReciboPDF({ negociacion, disabled = false }: Props) {
  const storageKey = `recibo_generado_${negociacion.id}`;

  // Verificar si ya fue generado antes (persiste entre sesiones)
  const [generando, setGenerando] = useState(false);
  const [generado, setGenerado]   = useState(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(storageKey);
  });

  async function generarPDF() {
    if (generado || disabled) return;
    setGenerando(true);

    // Importación dinámica para no bloquear el bundle inicial
    const { jsPDF } = await import('jspdf');

    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W    = 210;   // ancho A4
    const marL = 20;
    const marR = W - 20;
    let   y    = 20;

    const f = negociacion.factura!;
    const e = negociacion.envio;

    // ── Paleta ──────────────────────────────────────────
    const ROJO    = [220, 38, 38]  as [number, number, number];
    const GRIS_OS = [30, 30, 30]   as [number, number, number];
    const GRIS_ME = [90, 90, 90]   as [number, number, number];
    const GRIS_CL = [200, 200, 200]as [number, number, number];
    const BLANCO  = [255, 255, 255]as [number, number, number];
    const BG_FILA = [248, 248, 248]as [number, number, number];

    // ── Header: banda roja ───────────────────────────────
    doc.setFillColor(...ROJO);
    doc.rect(0, 0, W, 32, 'F');

    // Logo / empresa
    doc.setTextColor(...BLANCO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('ERP Business Insight', marL, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Plataforma de Comercio de Combustibles', marL, 20);
    doc.text('erp-business.com · contacto@erp-business.com', marL, 26);

    // Número de recibo (derecha)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    const nro = nroRecibo(negociacion.id);
    doc.text(nro, marR, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('RECIBO DE ENVÍO', marR, 20, { align: 'right' });
    doc.text(`Fecha: ${formatFecha(negociacion.createdAt)}`, marR, 26, { align: 'right' });

    y = 42;

    // ── Título ───────────────────────────────────────────
    doc.setTextColor(...GRIS_OS);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('RECIBO DE OPERACIÓN DE COMBUSTIBLE', W / 2, y, { align: 'center' });
    y += 6;

    // Línea decorativa
    doc.setDrawColor(...ROJO);
    doc.setLineWidth(0.8);
    doc.line(marL, y, marR, y);
    y += 8;

    // ── Sección: Partes ──────────────────────────────────
    const colMid = W / 2;

    // Bloque REMITENTE (vendedor)
    doc.setFillColor(...BG_FILA);
    doc.roundedRect(marL, y, (colMid - marL - 4), 30, 2, 2, 'F');

    doc.setTextColor(...ROJO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('REMITENTE (VENDEDOR)', marL + 4, y + 6);

    doc.setTextColor(...GRIS_OS);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(negociacion.vendedor.name, marL + 4, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_ME);
    doc.text(negociacion.vendedor.email, marL + 4, y + 19);
    doc.text(`Origen: ${e?.origen ?? negociacion.ciudad}`, marL + 4, y + 25);

    // Bloque DESTINATARIO (comprador)
    doc.setFillColor(...BG_FILA);
    doc.roundedRect(colMid + 2, y, (marR - colMid - 2), 30, 2, 2, 'F');

    doc.setTextColor(...ROJO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('DESTINATARIO (COMPRADOR)', colMid + 6, y + 6);

    doc.setTextColor(...GRIS_OS);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(negociacion.comprador.name, colMid + 6, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_ME);
    doc.text(negociacion.comprador.email, colMid + 6, y + 19);
    doc.text(`Destino: ${e?.destino ?? negociacion.direccionEntrega}`, colMid + 6, y + 25);

    y += 38;

    // ── Sección: Detalle del producto ────────────────────
    doc.setTextColor(...ROJO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('DETALLE DEL PRODUCTO', marL, y);
    y += 4;

    doc.setDrawColor(...GRIS_CL);
    doc.setLineWidth(0.3);
    doc.line(marL, y, marR, y);
    y += 5;

    // Encabezados tabla
    const cols = {
      desc:   marL,
      tipo:   marL + 65,
      cant:   marL + 105,
      precio: marL + 135,
      total:  marL + 158,
    };

    doc.setFillColor(...ROJO);
    doc.rect(marL, y, marR - marL, 7, 'F');
    doc.setTextColor(...BLANCO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('DESCRIPCIÓN',    cols.desc + 2,  y + 5);
    doc.text('TIPO',           cols.tipo + 2,  y + 5);
    doc.text('CANTIDAD',       cols.cant + 2,  y + 5);
    doc.text('PRECIO/GAL',     cols.precio + 2,y + 5);
    doc.text('TOTAL',          cols.total + 2, y + 5);
    y += 10;

    // Fila de producto
    doc.setFillColor(...BG_FILA);
    doc.rect(marL, y - 2, marR - marL, 8, 'F');
    doc.setTextColor(...GRIS_OS);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    const descripcion = `Combustible - ${negociacion.tipoProducto}`;
    doc.text(descripcion,                                         cols.desc + 2,  y + 3);
    doc.text(negociacion.tipoProducto,                            cols.tipo + 2,  y + 3);
    doc.text(`${negociacion.cantidad.toLocaleString()} gal`,      cols.cant + 2,  y + 3);
    doc.text(formatCOP(Number(negociacion.precioUnitario)),        cols.precio + 2,y + 3);
    doc.text(formatCOP(Number(f.subtotal)),                       cols.total + 2, y + 3);
    y += 12;

    // ── Resumen financiero ───────────────────────────────
    const xLabel = 120;
    const xValue = marR;

    const filaFinanciera = (label: string, value: string, bold = false, color?: [number, number, number]) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(bold ? 9 : 8);
      doc.setTextColor(...(color ?? GRIS_ME));
      doc.text(label, xLabel, y);
      doc.setTextColor(...(bold ? GRIS_OS : GRIS_ME));
      doc.text(value, xValue, y, { align: 'right' });
      y += 6;
    };

    doc.setDrawColor(...GRIS_CL);
    doc.line(marL, y, marR, y);
    y += 5;

    filaFinanciera('Subtotal:', formatCOP(Number(f.subtotal)));
    if (Number(f.costoFlete) > 0) {
      filaFinanciera('Flete:', formatCOP(Number(f.costoFlete)));
    }
    filaFinanciera('Comisión plataforma (2%):', formatCOP(Number(f.comisionPlataforma)));

    // Línea y total
    doc.setDrawColor(...ROJO);
    doc.setLineWidth(0.6);
    doc.line(xLabel, y, marR, y);
    y += 5;

    doc.setFillColor(...ROJO);
    doc.roundedRect(xLabel - 2, y - 2, marR - xLabel + 4, 10, 2, 2, 'F');
    doc.setTextColor(...BLANCO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL:', xLabel + 2, y + 5);
    doc.text(formatCOP(Number(f.total)), xValue - 2, y + 5, { align: 'right' });
    y += 16;

    // ── Sección: Info del envío ──────────────────────────
    if (e) {
      doc.setTextColor(...ROJO);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('INFORMACIÓN DEL ENVÍO', marL, y);
      y += 4;
      doc.setDrawColor(...GRIS_CL);
      doc.line(marL, y, marR, y);
      y += 6;

      const campo = (label: string, valor: string) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...GRIS_ME);
        doc.text(label, marL, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRIS_OS);
        doc.text(valor, marL + 45, y);
        y += 6;
      };

      campo('Estado del envío:',    e.estadoEnvio.replace('_', ' '));
      campo('Origen:',              e.origen);
      campo('Destino:',             e.destino);
      if (e.conductorNombre)   campo('Conductor:',    e.conductorNombre);
      if (e.vehiculoPlaca)     campo('Placa:',        e.vehiculoPlaca);
      if (e.conductorTelefono) campo('Tel. conductor:', e.conductorTelefono);
      if (e.fechaSalida)       campo('Fecha salida:', formatFecha(e.fechaSalida));
      if (e.fechaEntregaEst)   campo('Entrega est.:',  formatFecha(e.fechaEntregaEst));
      if (e.fechaEntregaReal)  campo('Entrega real:',  formatFecha(e.fechaEntregaReal));
      if (e.observaciones)     campo('Observaciones:', e.observaciones);
      y += 4;
    }

    // ── Sección: Pago ────────────────────────────────────
    doc.setTextColor(...ROJO);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('ESTADO DEL PAGO', marL, y);
    y += 4;
    doc.setDrawColor(...GRIS_CL);
    doc.line(marL, y, marR, y);
    y += 6;

    const estadoPagoLabel: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      COMPROBANTE_SUBIDO: 'Comprobante subido',
      VERIFICANDO: 'En verificación',
      CONFIRMADO: 'Confirmado ✓',
      RECHAZADO: 'Rechazado',
    };

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRIS_ME);
    doc.text('Estado:', marL, y);
    doc.setTextColor(...GRIS_OS);
    doc.text(estadoPagoLabel[f.estadoPago] ?? f.estadoPago, marL + 45, y);
    y += 6;

    if (f.metodoPago) {
      doc.setTextColor(...GRIS_ME);
      doc.text('Método de pago:', marL, y);
      doc.setTextColor(...GRIS_OS);
      doc.text(f.metodoPago, marL + 45, y);
      y += 6;
    }

    if (f.fondosLiberados) {
      doc.setFillColor(220, 252, 231);
      doc.roundedRect(marL, y, marR - marL, 9, 2, 2, 'F');
      doc.setTextColor(21, 128, 61);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('✓ Fondos liberados — Negociación completada exitosamente', marL + 4, y + 6);
      y += 14;
    }

    // ── Firmas ───────────────────────────────────────────
    y = Math.max(y + 10, 230); // empujar firmas hacia abajo si hay espacio

    doc.setDrawColor(...GRIS_CL);
    doc.setLineWidth(0.4);

    const firmaY = y + 15;
    // Líneas de firma
    doc.line(marL,          firmaY, marL + 55,          firmaY);
    doc.line(W/2 - 27,     firmaY, W/2 + 27,           firmaY);
    doc.line(marR - 55,    firmaY, marR,                firmaY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS_ME);
    doc.text('Vendedor',        marL + 27,      firmaY + 5, { align: 'center' });
    doc.text(negociacion.vendedor.name, marL + 27, firmaY + 9, { align: 'center' });

    doc.text('Comprador',       W/2,            firmaY + 5, { align: 'center' });
    doc.text(negociacion.comprador.name, W/2,   firmaY + 9, { align: 'center' });

    doc.text('ERP Business Insight', marR - 27, firmaY + 5, { align: 'center' });
    doc.text('(Plataforma)',    marR - 27,      firmaY + 9, { align: 'center' });

    // ── Footer ───────────────────────────────────────────
    doc.setFillColor(...ROJO);
    doc.rect(0, 285, W, 12, 'F');
    doc.setTextColor(...BLANCO);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(
      `${nro} · Generado el ${new Date().toLocaleDateString('es-CO')} · ERP Business Insight S.A.S · Documento de uso interno`,
      W / 2, 292, { align: 'center' }
    );

    // ── Descargar ────────────────────────────────────────
    doc.save(`${nro}_recibo_envio.pdf`);
    // Marcar como generado en localStorage para persistir entre sesiones
    localStorage.setItem(storageKey, new Date().toISOString());
    setGenerado(true);
    setGenerando(false);
  }

  return (
    <button
      onClick={generarPDF}
      disabled={generando || generado || disabled}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
        generado || disabled
          ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-300 hover:text-red-600 shadow-sm'
      }`}
    >
      {generando ? (
        <><Loader2 className="w-4 h-4 animate-spin" />Generando PDF...</>
      ) : generado || disabled ? (
        <><CheckCircle className="w-4 h-4" />Recibo descargado</>
      ) : (
        <><FileText className="w-4 h-4" />Descargar recibo PDF</>
      )}
    </button>
  );
}