/** Copy humano de login portal/landing. Sin códigos Firebase ni jerga. */

export type PortalLoginEstado = 'inactive' | 'none' | 'staff';

function authCode(error: unknown): string {
  const raw = (error as { code?: string } | null)?.code;
  return String(raw || '')
    .replace(/^auth\//, '')
    .toLowerCase();
}

export function mensajeErrorLoginPortal(error: unknown): string {
  const code = authCode(error);

  switch (code) {
    case 'wrong-password':
    case 'invalid-credential':
    case 'invalid-login-credentials':
      return 'Contraseña incorrecta. Revísala e inténtalo de nuevo.';
    case 'user-not-found':
      return 'No encontramos esa cuenta. Revisa el correo o crea tu cuenta de dueño.';
    case 'too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    case 'invalid-email':
      return 'Ese correo no tiene un formato válido.';
    case 'user-disabled':
      return 'Esta cuenta está desactivada. Llama a la clínica al 81 3602 4090.';
    case 'network-request-failed':
      return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
    default:
      return 'No pudimos entrar. Revisa correo y contraseña. Si las olvidaste, llama a la clínica.';
  }
}

export function mensajeEstadoLoginPortal(estado: PortalLoginEstado): string {
  switch (estado) {
    case 'inactive':
      return 'Tu acceso no está activo. Llama a la clínica al 81 3602 4090 para activarlo.';
    case 'staff':
      return 'Esta cuenta es del personal. El portal es solo para dueños. Usa «Acceso del personal».';
    case 'none':
      return 'No encontramos tu perfil de dueño. Revisa el correo. Si eres del equipo, usa «Acceso del personal».';
  }
}

export function mensajeErrorLoginStaff(error: unknown): string {
  const code = authCode(error);

  switch (code) {
    case 'wrong-password':
    case 'invalid-credential':
    case 'invalid-login-credentials':
      return 'Contraseña incorrecta. Revísala e inténtalo de nuevo.';
    case 'user-not-found':
      return 'No encontramos esa cuenta. Revisa el correo. Si eres dueño, entra por «Soy cliente».';
    case 'too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    case 'invalid-email':
      return 'Ese correo no tiene un formato válido.';
    case 'network-request-failed':
      return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
    default:
      return 'No pudimos entrar. Revisa correo y contraseña.';
  }
}
