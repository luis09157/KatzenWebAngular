/** Teléfono público de landing (Config/clinica no es legible por dueño — spec 074). */
export const CLINICA_TELEFONO_DISPLAY_FALLBACK = '81 3602 4090';
export const CLINICA_TELEFONO_E164_FALLBACK = '+528136024090';

export interface ClinicaTelefonoVista {
  display: string;
  telHref: string;
  e164: string;
}

function soloDigitos(raw: string): string {
  return raw.replace(/\D/g, '');
}

function aE164Mx(digits: string): string {
  if (digits.startsWith('52') && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+52${digits}`;
  }
  if (digits.startsWith('0')) {
    return aE164Mx(digits.replace(/^0+/, ''));
  }
  return digits ? `+${digits}` : CLINICA_TELEFONO_E164_FALLBACK;
}

/** Prefiere un teléfono de Config/environment; si no, el de la landing. */
export function resolveClinicaTelefono(
  raw?: string | null,
  fallbackDisplay = CLINICA_TELEFONO_DISPLAY_FALLBACK
): ClinicaTelefonoVista {
  const trimmed = String(raw || '').trim();
  const digits = soloDigitos(trimmed);
  if (digits.length < 8) {
    return {
      display: fallbackDisplay,
      telHref: `tel:${CLINICA_TELEFONO_E164_FALLBACK}`,
      e164: CLINICA_TELEFONO_E164_FALLBACK,
    };
  }
  const e164 = aE164Mx(digits);
  return {
    display: trimmed || fallbackDisplay,
    telHref: `tel:${e164}`,
    e164,
  };
}
