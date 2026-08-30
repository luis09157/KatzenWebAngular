/** Configuración estándar para diálogos del panel admin. */
export const ADMIN_DIALOG_CONFIG = {
  width: '840px',
  maxWidth: '96vw',
  maxHeight: '88vh',
  panelClass: 'admin-dialog-panel',
  autoFocus: false
};

export const ADMIN_DIALOG_WIDE = {
  ...ADMIN_DIALOG_CONFIG,
  width: '860px',
  maxWidth: '96vw'
};

export const ADMIN_DIALOG_DETAIL = {
  ...ADMIN_DIALOG_CONFIG,
  width: '680px',
  maxWidth: '94vw'
};

/** Formularios clínicos extensos (historial, vacuna, baño, recordatorio). */
export const ADMIN_DIALOG_FORM = {
  ...ADMIN_DIALOG_CONFIG,
  width: '900px',
  maxWidth: '96vw'
};

/**
 * Caja POS / punto de venta (spec 055). Tres rieles: petshop, consulta, peluquería.
 * Móvil: viewport completo. Desktop: panel ancho (CSS `--pos`).
 */
export const ADMIN_DIALOG_POS = {
  ...ADMIN_DIALOG_CONFIG,
  width: '100vw',
  maxWidth: '100vw',
  height: '100vh',
  maxHeight: '100vh',
  panelClass: ['admin-dialog-panel', 'admin-dialog-panel--pos']
};

/** Diálogos de confirmación compactos. */
export const ADMIN_DIALOG_CONFIRM = {
  ...ADMIN_DIALOG_CONFIG,
  width: '480px',
  maxWidth: '94vw'
};

/**
 * Selector de hora (timepicker) anidable sobre formularios.
 * Panel ~420px: deja aire para padding picker (28×32) + dos selects.
 * Shell: añadir clase `admin-dialog-shell--picker` (ver admin-dialog.scss).
 */
export const ADMIN_DIALOG_TIMEPICKER = {
  ...ADMIN_DIALOG_CONFIG,
  width: '420px',
  maxWidth: '94vw',
  maxHeight: '90vh'
};
