/**
 * Spec 034 — normalización de alergias de mascota (fuente de verdad: Mascota.alergias).
 * Admite array, texto legacy y snapshots de baño sin romper datos existentes.
 */

export function normalizeAlergias(raw: unknown): string[] {
  if (raw == null) {
    return [];
  }

  if (Array.isArray(raw)) {
    return dedupeTrim(raw.map(item => String(item ?? '')));
  }

  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const fromArray = normalizeAlergias(obj['alergias']);
    if (fromArray.length) {
      return fromArray;
    }
    const fromTexto = normalizeAlergias(
      obj['alergiasTexto'] ?? obj['alergias_texto'] ?? obj['alergias_conocidas']
    );
    if (fromTexto.length) {
      return fromTexto;
    }
    return [];
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return [];
    }
    return dedupeTrim(trimmed.split(/[,;\n|]+/));
  }

  return dedupeTrim([String(raw)]);
}

function dedupeTrim(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const t = item.trim().replace(/\s+/g, ' ');
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}
