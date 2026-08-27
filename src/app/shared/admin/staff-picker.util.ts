import { StaffUsuarioLike } from './staff-picker.models';

/** Perfiles clínicos típicos (cita / historial / vacuna). */
const DOCTOR_PERFIL_RE = /doctor|medico|veterinario/i;

/** Perfiles de peluquería / grooming. */
const PELUQUERO_PERFIL_RE = /peluquero|groomer|estetica/i;

export function isStaffActivo(u: StaffUsuarioLike): boolean {
  return u?.activo !== false && !!u?.id;
}

export function matchesStaffRoleFilter(
  u: StaffUsuarioLike,
  filter: 'doctor' | 'peluquero' | 'all'
): boolean {
  if (filter === 'all') {
    return true;
  }
  const perfil = String(u?.perfil || u?.staffRole || '');
  if (filter === 'doctor') {
    return DOCTOR_PERFIL_RE.test(perfil);
  }
  if (filter === 'peluquero') {
    // Incluye staff con perfil peluquero; si no hay ninguno, el caller puede usar 'all'
    return PELUQUERO_PERFIL_RE.test(perfil);
  }
  return true;
}

export function filterStaffUsuarios(
  usuarios: StaffUsuarioLike[],
  filter: 'doctor' | 'peluquero' | 'all'
): StaffUsuarioLike[] {
  return (usuarios || [])
    .filter(isStaffActivo)
    .filter(u => matchesStaffRoleFilter(u, filter))
    .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
}

/** Nombre a mostrar: preferir denorm; si no, legacy. */
export function resolveStaffDisplay(opts: {
  nombre?: string | null;
  uid?: string | null;
  usuarios?: StaffUsuarioLike[];
}): string {
  const nombre = String(opts.nombre || '').trim();
  if (nombre) {
    return nombre;
  }
  const uid = String(opts.uid || '').trim();
  if (uid && opts.usuarios?.length) {
    const found = opts.usuarios.find(u => u.id === uid);
    if (found?.nombre) {
      return String(found.nombre).trim();
    }
  }
  return '';
}

/**
 * Resuelve UID al editar: usa uid guardado; si solo hay nombre legacy, match por nombre.
 */
export function resolveStaffUidFromLegacy(opts: {
  uid?: string | null;
  nombre?: string | null;
  usuarios: StaffUsuarioLike[];
}): string {
  const uid = String(opts.uid || '').trim();
  if (uid && opts.usuarios.some(u => u.id === uid)) {
    return uid;
  }
  const nombre = String(opts.nombre || '').trim().toLowerCase();
  if (!nombre) {
    return uid; // conservar uid aunque no esté en lista activa
  }
  const byName = opts.usuarios.find(
    u => String(u.nombre || '').trim().toLowerCase() === nombre
  );
  return byName?.id || uid || '';
}
