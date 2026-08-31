/**
 * Hidratación segura de filas RTDB: la key del nodo siempre gana sobre un `id` interno.
 * Shape móvil (Nombre, idCliente) se lee sin pisar la clave.
 */

export function mapRtdbRow<T extends object>(
  key: string | null | undefined,
  val: unknown
): T & { id: string } {
  const raw =
    val && typeof val === 'object' && !Array.isArray(val)
      ? { ...(val as Record<string, unknown>) }
      : {};
  const keyId = String(key || '').trim();
  const storedId = raw['id'] != null ? String(raw['id']).trim() : '';
  if (storedId && keyId && storedId !== keyId) {
    raw['idLegacy'] = storedId;
  }
  return { ...raw, id: keyId } as T & { id: string };
}

export function pickLegacyString(
  obj: Record<string, unknown> | null | undefined,
  ...keys: string[]
): string {
  if (!obj) {
    return '';
  }
  for (const k of keys) {
    const v = obj[k];
    if (v != null && String(v).trim()) {
      return String(v).trim();
    }
  }
  return '';
}

export function collectRelatedIds(
  row: Record<string, unknown> | null | undefined,
  extraKeys: string[] = []
): string[] {
  if (!row) {
    return [];
  }
  const ids: string[] = [];
  const push = (v: unknown) => {
    const s = String(v ?? '').trim();
    if (s && !ids.includes(s)) {
      ids.push(s);
    }
  };
  push(row['id']);
  push(row['idLegacy']);
  for (const k of extraKeys) {
    push(row[k]);
  }
  return ids;
}

export function registroPerteneceAPaciente(
  row: Record<string, unknown> | { paciente_id?: string; idPaciente?: string; id_paciente?: string } | null | undefined,
  pacienteIds: string | string[]
): boolean {
  if (!row) {
    return false;
  }
  const rec = row as Record<string, unknown>;
  const ids = (Array.isArray(pacienteIds) ? pacienteIds : [pacienteIds])
    .map(id => String(id || '').trim())
    .filter(Boolean);
  const rowId = String(rec['paciente_id'] || rec['idPaciente'] || rec['id_paciente'] || '').trim();
  return !!rowId && ids.includes(rowId);
}

export function dedupeRowsById<T extends { id?: string }>(rows: T[]): T[] {
  const map = new Map<string, T>();
  for (const r of rows) {
    const id = String(r?.id || '').trim();
    if (id) {
      map.set(id, r);
    }
  }
  return [...map.values()];
}
