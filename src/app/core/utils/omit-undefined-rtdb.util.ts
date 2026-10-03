/**
 * Firebase RTDB `push`/`update` rechaza `undefined` en cualquier propiedad del valor.
 * Usar antes de escribir payloads (visita, pensión, etc.).
 */

/** Quita claves con valor `undefined` (RTDB push/update). Conserva `null`, `0`, `''`. */
export function omitUndefinedRtdb<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as T;
}
