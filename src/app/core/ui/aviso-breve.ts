/**
 * 2026-10-30 — aviso breve de «listo» que se quita solo (sin botón OK).
 * Para confirmar que algo se guardó; los errores y las preguntas siguen siendo ventanas normales.
 */
import Swal from 'sweetalert2';

export function avisoBreve(titulo: string, texto?: string, ms = 2200): Promise<unknown> {
  return Swal.fire({
    toast: true,
    position: 'top',
    icon: 'success',
    title: titulo,
    text: texto || undefined,
    timer: ms,
    timerProgressBar: true,
    showConfirmButton: false,
  });
}
