import Swal from 'sweetalert2';

export interface PromptMontoVisitaOpts {
  sugerido?: number;
  /** Baño: siempre abrir el diálogo con el default precargado (editable). */
  forzarDialogo?: boolean;
}

function parseOpts(raw?: number | PromptMontoVisitaOpts): PromptMontoVisitaOpts {
  if (typeof raw === 'number') return { sugerido: raw };
  if (raw && typeof raw === 'object') {
    return {
      sugerido: raw.sugerido,
      forzarDialogo: !!raw.forzarDialogo
    };
  }
  return {};
}

/**
 * Pide monto al staff.
 * Si hay `sugerido > 0` y no se fuerza diálogo, usa el precio (inventario / catálogo).
 * Baño: `forzarDialogo` + valor precargado — nunca un campo vacío si hay default.
 */
export async function promptMontoVisita(
  titulo: string,
  inputLabel: string,
  sugeridoOOpts?: number | PromptMontoVisitaOpts
): Promise<number | null> {
  const opts = parseOpts(sugeridoOOpts);
  const sugerido = opts.sugerido;
  if (sugerido != null && sugerido > 0 && !opts.forzarDialogo) return sugerido;
  const ask = await Swal.fire({
    icon: 'question',
    title: titulo,
    input: 'number',
    inputLabel,
    inputAttributes: { min: '0.01', step: '0.01' },
    inputValue: sugerido && sugerido > 0 ? String(sugerido) : '',
    showCancelButton: true,
    confirmButtonText: 'Agregar a cuenta',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      const n = Number(value);
      if (!(n > 0)) return 'Ingresa un monto mayor a 0';
      return null;
    }
  });
  if (!ask.isConfirmed) return null;
  return Number(ask.value);
}
