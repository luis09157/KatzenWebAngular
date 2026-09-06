/** Normaliza custom claims de Auth a accesos staff/cliente (sin jerga en UI). */

export interface ClaimsAccess {
  staffAccess: boolean;
  clientAccess: boolean;
  clienteId?: string;
  staffRole?: string;
  mustChangePassword?: boolean;
}

export function accessFromAuthClaims(claims: Record<string, unknown> | null | undefined): ClaimsAccess {
  if (!claims) {
    return { staffAccess: false, clientAccess: false };
  }

  const roleClaim = String(claims['role'] || '').toLowerCase();
  const rolesList = Array.isArray(claims['roles'])
    ? (claims['roles'] as unknown[]).map((r) => String(r).toLowerCase())
    : [];
  const roleSet = new Set([roleClaim, ...rolesList].filter(Boolean));

  const dualAccess = claims['dualAccess'] === true || roleSet.has('dual');
  const clienteIdRaw = claims['clienteId'];
  const clienteId = typeof clienteIdRaw === 'string' && clienteIdRaw.trim() ? clienteIdRaw : undefined;
  const staffRoleRaw = claims['staffRole'];
  const staffRole = typeof staffRoleRaw === 'string' && staffRoleRaw.trim() ? staffRoleRaw : undefined;

  return {
    staffAccess: dualAccess || roleSet.has('staff'),
    clientAccess: dualAccess || roleSet.has('client'),
    clienteId,
    staffRole,
    mustChangePassword: claims['mustChangePassword'] === true,
  };
}
