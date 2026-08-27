export type StaffPickerRoleFilter = 'doctor' | 'peluquero' | 'all';

export interface StaffPickerFields {
  /** Campo UID en el FormGroup (canónico por entidad). */
  uidField: string;
  /** Campo nombre display / legacy en el FormGroup. */
  nombreField: string;
}

export interface StaffUsuarioLike {
  id?: string;
  nombre?: string;
  correo?: string;
  perfil?: string;
  staffRole?: string;
  activo?: boolean;
  [key: string]: unknown;
}

export const DEFAULT_STAFF_PICKER_FIELDS: StaffPickerFields = {
  uidField: 'staffUid',
  nombreField: 'staffNombre'
};
