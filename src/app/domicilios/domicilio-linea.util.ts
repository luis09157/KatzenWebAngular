import { VisitaLinea } from '../visitas/visitas.models';
import { DomicilioDatos } from './domicilio.models';

/** Spec 107 — línea «Domicilio» para el ticket. */
export function descripcionLineaDomicilio(dom: DomicilioDatos, paciente?: string): string {
  const mascota = String(paciente || '').trim();
  const km = Number(dom?.km) || 0;
  return ['Domicilio', dom?.tipoNombre, km ? `${km} km` : '', mascota].filter(Boolean).join(' · ');
}

export function lineaDomicilio(
  id: string,
  dom: DomicilioDatos,
  opts: { paciente?: string; origen?: { tipo: 'banio' | 'cita'; id: string } } = {}
): VisitaLinea {
  const precio = Math.round((Number(dom.precio) || 0) * 100) / 100;
  const costo = Math.round((Number(dom.costoGasolina) || 0) * 100) / 100;
  return {
    id,
    descripcion: descripcionLineaDomicilio(dom, opts.paciente),
    monto: precio,
    categoria: 'domicilio',
    cantidad: 1,
    domicilio: dom,
    ...(opts.origen?.id ? { domicilioDe: opts.origen } : {}),
    costo,
    precio_venta: precio,
    ganancia: Math.round((precio - costo) * 100) / 100,
    aplicaIva: false,
  };
}

/** ¿Ya hay línea de domicilio de ese baño/cita en el ticket? (evita duplicarla). */
export function domicilioYaEnLineas(
  lineas: VisitaLinea[] | null | undefined,
  origen: { tipo: 'banio' | 'cita'; id: string }
): boolean {
  return (lineas || []).some(
    (l) => l.categoria === 'domicilio' && l.domicilioDe?.tipo === origen.tipo && l.domicilioDe?.id === origen.id
  );
}

/** Domicilio válido guardado en un baño/cita (o null). */
export function domicilioDeOrigen(raw: unknown): DomicilioDatos | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as DomicilioDatos;
  return Number(d.precio) >= 0 && Number(d.km) > 0 ? d : null;
}
