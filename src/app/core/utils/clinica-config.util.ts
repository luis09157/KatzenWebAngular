/** Spec 072 — defaults y normalización de `Katzen/Config/clinica`. */

export interface ClinicaConfig {
  nombre?: string;
  logoUrl?: string;
  horario?: string;
  ivaDefaultPct?: number;
  vetDefaultUid?: string;
  vetDefaultNombre?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export const CLINICA_NOMBRE_DEFAULT = 'KatzenVet';

export function clampIvaPct(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

export function normalizeClinicaConfig(raw: ClinicaConfig | null | undefined): ClinicaConfig {
  const src = raw || {};
  const nombre = String(src.nombre || '').trim();
  const logoUrl = String(src.logoUrl || '').trim();
  const horario = String(src.horario || '').trim();
  const vetDefaultUid = String(src.vetDefaultUid || '').trim();
  const vetDefaultNombre = String(src.vetDefaultNombre || '').trim();
  return {
    nombre: nombre || CLINICA_NOMBRE_DEFAULT,
    logoUrl,
    horario,
    ivaDefaultPct: clampIvaPct(src.ivaDefaultPct),
    vetDefaultUid,
    vetDefaultNombre,
    updatedAt: src.updatedAt,
    updatedBy: src.updatedBy,
  };
}

export function nombreClinicaVisible(raw: ClinicaConfig | null | undefined): string {
  return normalizeClinicaConfig(raw).nombre || CLINICA_NOMBRE_DEFAULT;
}

export function payloadClinicaParaGuardar(form: Partial<ClinicaConfig>, staffId?: string): ClinicaConfig {
  const n = normalizeClinicaConfig(form);
  return {
    nombre: n.nombre,
    logoUrl: n.logoUrl || undefined,
    horario: n.horario || undefined,
    ivaDefaultPct: n.ivaDefaultPct,
    vetDefaultUid: n.vetDefaultUid || undefined,
    vetDefaultNombre: n.vetDefaultNombre || undefined,
    updatedAt: new Date().toISOString(),
    updatedBy: staffId || undefined,
  };
}
