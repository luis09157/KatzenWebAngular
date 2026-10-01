/**
 * SweetAlert2 alineado a marca Katzen (spec 084).
 * Usar en pantallas clave; overrides locales (p. ej. confirm destructivo rojo) siguen válidos.
 */
import Swal from 'sweetalert2';

/** Confirm primario = `--katzen-verde`; cancel = slate. */
export const KATZEN_SWAL_CONFIRM = '#0A969B';
export const KATZEN_SWAL_CANCEL = '#64748b';
/** Destructivo «Borrar» / advertencias — override explícito en el fire. */
export const KATZEN_SWAL_DANGER = '#b91c1c';

export const KatzenSwal = Swal.mixin({
  confirmButtonColor: KATZEN_SWAL_CONFIRM,
  cancelButtonColor: KATZEN_SWAL_CANCEL,
});

export default KatzenSwal;
