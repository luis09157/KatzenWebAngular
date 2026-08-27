import Swal from 'sweetalert2';

/** Pide monto al staff si el servicio no trae precio (patrón baños/citas). */
export async function promptMontoVisita(
  titulo: string,
  inputLabel: string,
  sugerido?: number
): Promise<number | null> {
  if (sugerido != null && sugerido > 0) return sugerido;
  const ask = await Swal.fire({
    icon: 'question',
    title: titulo,
    input: 'number',
    inputLabel,
    inputAttributes: { min: '0.01', step: '0.01' },
    inputValue: sugerido && sugerido > 0 ? String(sugerido) : '',
    showCancelButton: true,
    confirmButtonText: 'Agregar a visita',
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
