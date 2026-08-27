/** Spec 046 — venta petshop sin cliente registrado (walk-in). */
export const CLIENTE_MOSTRADOR_ID = '__mostrador__';
export const CLIENTE_MOSTRADOR_NOMBRE = 'Mostrador / público';

export function esClienteMostrador(clienteId: string | null | undefined): boolean {
  return String(clienteId || '').trim() === CLIENTE_MOSTRADOR_ID;
}

export function esVisitaMostrador(v: {
  esMostrador?: boolean;
  cliente_id?: string | null;
} | null | undefined): boolean {
  if (!v) return false;
  if (v.esMostrador === true) return true;
  return esClienteMostrador(v.cliente_id);
}
