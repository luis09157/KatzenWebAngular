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

/** Diálogos de confirmación compactos. */
export const ADMIN_DIALOG_CONFIRM = {
  ...ADMIN_DIALOG_CONFIG,
  width: '480px',
  maxWidth: '94vw'
};
