/**
 * Spec 047 ola 3 — match self-reg por teléfono MX (10 dígitos) + mascota.
 * No auto-vincula: el callable usa estas decisiones para pedir confirmación.
 */

export function digitsOnly(raw: unknown): string {
  return String(raw ?? '').replace(/\D/g, '');
}

/**
 * Normaliza a 10 dígitos MX (sin +52). Null si no es un móvil/fijo MX plausible.
 * Acepta: 8136024090, +52 81 3602 4090, 528136024090, 044/045 + 10.
 */
export function normalizeMxPhone(raw: unknown): string | null {
  let d = digitsOnly(raw);
  if (!d) {
    return null;
  }
  if ((d.startsWith('044') || d.startsWith('045')) && d.length === 13) {
    d = d.slice(3);
  }
  if (d.startsWith('52') && d.length >= 12) {
    d = d.slice(2);
  }
  if (d.length === 11 && d.startsWith('1')) {
    d = d.slice(1);
  }
  if (d.length !== 10) {
    return null;
  }
  if (!/^[2-9]\d{9}$/.test(d)) {
    return null;
  }
  return d;
}

export function maskMxPhone(phone10: string): string {
  const d = digitsOnly(phone10);
  if (d.length < 4) {
    return '***';
  }
  return `***${d.slice(-4)}`;
}

export function foldPetName(raw: unknown): string {
  return String(raw ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Igualdad de nombre de mascota: exacto plegado, o primer token ≥3 chars. */
export function petNamesEquivalent(a: unknown, b: unknown): boolean {
  const fa = foldPetName(a);
  const fb = foldPetName(b);
  if (!fa || !fb) {
    return false;
  }
  if (fa === fb) {
    return true;
  }
  const ta = fa.split(' ')[0];
  const tb = fb.split(' ')[0];
  return ta.length >= 3 && ta === tb;
}

export function mascotaPerteneceACliente(
  mascota: { cliente_id?: unknown; idCliente?: unknown },
  clienteId: string
): boolean {
  if (!clienteId) {
    return false;
  }
  const a = String(mascota.cliente_id ?? '').trim();
  const b = String(mascota.idCliente ?? '').trim();
  return a === clienteId || b === clienteId;
}

export function isClienteLinkableForPortal(
  cliente: Record<string, unknown> | null | undefined
): boolean {
  if (!cliente || typeof cliente !== 'object') {
    return false;
  }
  if (cliente['activo'] === false) {
    return false;
  }
  if (cliente['portalActivo'] === true && cliente['authUid']) {
    return false;
  }
  return true;
}

export type PhoneMatchCandidate = { id: string; petNames: string[] };

export type PhoneMatchDecision =
  | { kind: 'none' }
  | { kind: 'needs_pet_name' }
  | { kind: 'ambiguous' }
  | { kind: 'suggest'; clienteId: string };

/**
 * Umbral ola 3: nunca auto-vínculo.
 * - 0 candidatos → none (alta nueva)
 * - 1 candidato → suggest (UI confirma). Si el dueño dio mascota y la ficha tiene
 *   mascotas que no coinciden → none (no forzar ficha ajena).
 * - N candidatos sin mascota → needs_pet_name (no filtrar padrón al browser)
 * - N candidatos + mascota única → suggest
 * - N candidatos + mascota que sigue ambigua → ambiguous (clínica, no alta ciega)
 */
export function resolvePhoneMatch(
  candidates: PhoneMatchCandidate[],
  nombreMascota?: string | null
): PhoneMatchDecision {
  const pet = String(nombreMascota ?? '').trim();
  if (!candidates.length) {
    return { kind: 'none' };
  }

  if (candidates.length === 1) {
    const only = candidates[0];
    if (pet && only.petNames.length > 0) {
      const hit = only.petNames.some(n => petNamesEquivalent(n, pet));
      if (!hit) {
        return { kind: 'none' };
      }
    }
    return { kind: 'suggest', clienteId: only.id };
  }

  if (!pet) {
    return { kind: 'needs_pet_name' };
  }

  const matched = candidates.filter(c => c.petNames.some(n => petNamesEquivalent(n, pet)));
  if (matched.length === 1) {
    return { kind: 'suggest', clienteId: matched[0].id };
  }
  if (matched.length === 0) {
    return { kind: 'none' };
  }
  return { kind: 'ambiguous' };
}

export function formatPetListEs(names: string[]): string {
  const clean = names.map(n => String(n || '').trim()).filter(Boolean);
  if (!clean.length) {
    return '';
  }
  if (clean.length === 1) {
    return clean[0];
  }
  if (clean.length === 2) {
    return `${clean[0]} y ${clean[1]}`;
  }
  return `${clean.slice(0, -1).join(', ')} y ${clean[clean.length - 1]}`;
}

export function buildPhoneConfirmMessage(petNames: string[], phone10: string): string {
  const masked = maskMxPhone(phone10);
  const list = formatPetListEs(petNames);
  if (list) {
    return `Encontramos una ficha en la clínica con este teléfono (${masked}) y mascota(s): ${list}. Confirma que eres el dueño antes de vincular tu cuenta.`;
  }
  return `Encontramos una ficha en la clínica con el teléfono ${masked}. Confirma que eres tú antes de vincular tu cuenta.`;
}
