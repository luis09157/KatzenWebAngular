/**
 * Folio legible del expediente de **mascota** (spec 068).
 *
 * Prioridad:
 * 1. Número capturado en la mascota (`expediente` / `numeroExpediente`) — el de Excel/clínica.
 * 2. Si está vacío o es UUID: `KV-` + últimos 6 alfanuméricos del id.
 *
 * Nunca usa el `expediente` del dueño (`Katzen/Cliente`). En clínicas MX el folio
 * es por paciente; un dueño puede tener varias mascotas.
 * Nunca renderiza el UUID de 36 caracteres.
 */

const FOLIO_LEN = 6;
const MAX_STORED_LEN = 20;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface FolioExpedienteFuente {
  id?: string | null;
  /** Folio de la mascota (`Katzen/Mascota`). */
  expediente?: string | null;
  numeroExpediente?: string | null;
  /**
   * Expediente del dueño (`Katzen/Cliente`). Se ignora a propósito:
   * no es el número de la mascota.
   */
  expedienteCliente?: string | null;
}

function textoCorto(value: unknown): string {
  return String(value ?? '').trim();
}

function esUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/** Folio capturado usable: no vacío, corto y no es UUID. */
export function esFolioCapturadoValido(value: unknown): boolean {
  const stored = textoCorto(value);
  return !!stored && stored.length <= MAX_STORED_LEN && !esUuid(stored);
}

/** Últimos 6 caracteres alfanuméricos del id, en mayúsculas. */
export function folioCortoDesdeId(id: string | null | undefined): string {
  const limpio = textoCorto(id).replace(/[^a-z0-9]/gi, '');
  if (!limpio) {
    return '';
  }
  return limpio.slice(-FOLIO_LEN).toUpperCase();
}

/**
 * Folio humano de la mascota. El capturado gana; UUID/KV solo como fallback.
 * `expedienteCliente` se ignora.
 */
export function folioExpedientePaciente(paciente: FolioExpedienteFuente | null | undefined): string {
  const stored = textoCorto(paciente?.expediente || paciente?.numeroExpediente);
  if (esFolioCapturadoValido(stored)) {
    return stored;
  }
  const corto = folioCortoDesdeId(paciente?.id);
  return corto ? `KV-${corto}` : 'KV-S/N';
}

/**
 * Valor a persistir en `Katzen/Mascota.expediente`.
 * Si el usuario escribió folio, se guarda tal cual; si no, el KV derivado del id
 * (estable y buscable). No pisa un capturado válido.
 */
export function resolverExpedienteParaPersistir(capturado: unknown, id: string | null | undefined): string {
  if (esFolioCapturadoValido(capturado)) {
    return textoCorto(capturado);
  }
  return folioExpedientePaciente({ id });
}

/** Copy de UI: «Expediente 1847» o «Expediente KV-A1B2C3». */
export function etiquetaExpedientePaciente(paciente: FolioExpedienteFuente | null | undefined): string {
  return `Expediente ${folioExpedientePaciente(paciente)}`;
}
