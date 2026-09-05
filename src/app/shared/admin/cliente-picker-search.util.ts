/**
 * Spec 065 — búsqueda «teléfono primero» para pickers de cliente.
 * Recepción tiene el teléfono a la mano: si la consulta trae ≥3 dígitos,
 * primero salen las coincidencias por teléfono y después las de nombre.
 */
import { Cliente } from '../../core/models';
import { filtrarClientes } from '../../core/utils/cliente-search.util';

export const MIN_DIGITOS_BUSQUEDA_TELEFONO = 3;

/** Solo dígitos del texto (ignora espacios, guiones, paréntesis, `+`). */
export function soloDigitos(value: unknown): string {
  return String(value ?? '').replace(/\D+/g, '');
}

/** ¿La consulta parece un teléfono? Solo dígitos/separadores y ≥3 dígitos. */
export function consultaPareceTelefono(query: unknown): boolean {
  const q = String(query ?? '').trim();
  if (!q) return false;
  if (!/^[\d\s()+\-.]+$/.test(q)) return false;
  return soloDigitos(q).length >= MIN_DIGITOS_BUSQUEDA_TELEFONO;
}

export function clienteCoincideTelefono(cliente: Cliente | null | undefined, digitos: string): boolean {
  if (!cliente || !digitos) return false;
  const tel = soloDigitos(cliente.telefono);
  return !!tel && tel.includes(digitos);
}

/**
 * Filtra clientes activos priorizando teléfono cuando la consulta es numérica.
 * Texto normal → `filtrarClientes` (nombre, teléfono, correo, expediente).
 */
export function filtrarClientesTelefonoPrimero(clientes: Cliente[] | null | undefined, query: unknown): Cliente[] {
  const rows = clientes || [];
  if (!consultaPareceTelefono(query)) {
    return filtrarClientes(rows, typeof query === 'string' ? query : '');
  }
  const digitos = soloDigitos(query);
  const activos = rows.filter((c) => c && c.activo !== false);
  const porTelefono = activos.filter((c) => clienteCoincideTelefono(c, digitos));
  const ids = new Set(porTelefono.map((c) => c.id));
  const resto = filtrarClientes(activos, String(query)).filter((c) => !ids.has(c.id));
  return [...porTelefono, ...resto];
}
