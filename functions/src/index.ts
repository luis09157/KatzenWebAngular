import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onValueWritten } from 'firebase-functions/v2/database';
import { setGlobalOptions } from 'firebase-functions/v2';
import { generateSecurePassword, sendPortalWelcomeEmail } from './portal-mail';

admin.initializeApp();
setGlobalOptions({ region: 'us-central1' });

const db = admin.database();

interface AuthPerfil {
  authUid?: string;
  email?: string;
  role?: string;
  roles?: string[];
  staffRole?: string;
  clienteId?: string;
  activo?: boolean;
  mustChangePassword?: boolean;
}

interface StaffClaims {
  role: string;
  staffRole?: string;
  clienteId?: string;
  dualAccess?: boolean;
  mustChangePassword?: boolean;
}

function mapUsuarioPerfilToStaffRole(perfil: string | undefined): string {
  const p = String(perfil || '').toLowerCase();
  if (p === 'admin' || p === 'administrador') return 'administrador';
  if (p === 'super_admin' || p === 'superadmin') return 'super_admin';
  if (p === 'dueno' || p === 'dueño' || p === 'duena' || p === 'dueña') return 'super_admin';
  if (p === 'doctor') return 'doctor';
  if (p === 'recepcionista') return 'recepcionista';
  if (p === 'peluquero') return 'peluquero';
  return p || 'doctor';
}

function buildClaimsFromPerfil(perfil: AuthPerfil | null): StaffClaims {
  if (!perfil || perfil.activo === false) {
    return { role: 'none' };
  }

  const roles = new Set<string>();
  if (Array.isArray(perfil.roles)) {
    perfil.roles.forEach(r => roles.add(String(r).toLowerCase()));
  }
  if (perfil.role) {
    roles.add(String(perfil.role).toLowerCase());
  }

  const staffAccess = roles.has('staff') || perfil.role === 'staff' || perfil.role === 'dual';
  const clientAccess =
    (roles.has('client') || perfil.role === 'client' || perfil.role === 'dual') && !!perfil.clienteId;

  let role = 'none';
  if (staffAccess && clientAccess) {
    role = 'staff';
  } else if (staffAccess) {
    role = 'staff';
  } else if (clientAccess) {
    role = 'client';
  }

  const staffRole = perfil.staffRole
    ? String(perfil.staffRole).toLowerCase()
    : staffAccess
      ? 'doctor'
      : undefined;

  return {
    role,
    staffRole,
    clienteId: perfil.clienteId || undefined,
    dualAccess: staffAccess && clientAccess,
    mustChangePassword: perfil.mustChangePassword === true
  };
}

async function isCallerAdmin(uid: string, token: admin.auth.DecodedIdToken): Promise<boolean> {
  const staffRole = String(token.staffRole || '').toLowerCase();
  if (
    staffRole === 'administrador' ||
    staffRole === 'admin' ||
    staffRole === 'super_admin' ||
    staffRole === 'dueno' ||
    staffRole === 'dueño'
  ) {
    return true;
  }

  const snap = await db.ref(`Katzen/Usuarios/${uid}/perfil`).once('value');
  const perfil = String(snap.val() || '').toLowerCase();
  return (
    perfil === 'administrador' ||
    perfil === 'admin' ||
    perfil === 'super_admin' ||
    perfil === 'dueno' ||
    perfil === 'dueño'
  );
}

async function syncClaimsForUid(uid: string): Promise<StaffClaims> {
  const snap = await db.ref(`Katzen/AuthPerfiles/${uid}`).once('value');
  const perfil = (snap.val() || null) as AuthPerfil | null;
  const claims = buildClaimsFromPerfil(perfil);
  await admin.auth().setCustomUserClaims(uid, claims);
  return claims;
}

/** Callable: sincroniza claims del usuario autenticado desde AuthPerfiles. */
export const syncMyClaims = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const claims = await syncClaimsForUid(request.auth.uid);
  return {
    success: true,
    role: claims.role,
    staffRole: claims.staffRole,
    clienteId: claims.clienteId,
    message: 'Claims sincronizados'
  };
});

/** Trigger: al cambiar AuthPerfiles, actualizar claims automáticamente. */
export const onAuthPerfilWrite = onValueWritten(
  '/Katzen/AuthPerfiles/{uid}',
  async (event) => {
    const uid = event.params.uid;
    await syncClaimsForUid(uid);
  }
);

interface ProvisionStaffInput {
  email: string;
  password: string;
  nombre: string;
  telefono: string;
  perfil: string;
}

/** Callable (solo admin): crea Auth + AuthPerfiles + Usuarios con el mismo uid. */
export const provisionStaffUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerAdmin = await isCallerAdmin(request.auth.uid, request.auth.token);
  if (!callerAdmin) {
    throw new HttpsError('permission-denied', 'Solo administradores pueden crear usuarios.');
  }

  const data = request.data as ProvisionStaffInput;
  const email = String(data.email || '').trim().toLowerCase();
  const password = String(data.password || '');
  const nombre = String(data.nombre || '').trim();
  const telefono = String(data.telefono || '').trim();
  const perfilOperativo = String(data.perfil || 'doctor').toLowerCase();

  if (!email || !password || password.length < 8) {
    throw new HttpsError('invalid-argument', 'Email y contraseña (mín. 8 caracteres) son requeridos.');
  }
  if (!nombre || !telefono) {
    throw new HttpsError('invalid-argument', 'Nombre y teléfono son requeridos.');
  }

  const staffRole = mapUsuarioPerfilToStaffRole(perfilOperativo);
  const timestamp = new Date().toISOString();

  let userRecord: admin.auth.UserRecord;
  try {
    userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: nombre,
      disabled: false
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'No se pudo crear la cuenta Auth';
    throw new HttpsError('already-exists', message);
  }

  const uid = userRecord.uid;

  const authPerfil: AuthPerfil = {
    authUid: uid,
    email,
    role: 'staff',
    roles: ['staff'],
    staffRole,
    activo: true
  };

  const usuario = {
    id: uid,
    authUid: uid,
    nombre,
    correo: email,
    telefono,
    perfil: perfilOperativo,
    staffRole,
    activo: true,
    fecha_registro: timestamp,
    created_by: request.auth.uid
  };

  await db.ref(`Katzen/AuthPerfiles/${uid}`).set(authPerfil);
  await db.ref(`Katzen/Usuarios/${uid}`).set(usuario);

  const claims = await syncClaimsForUid(uid);

  return {
    success: true,
    uid,
    email,
    staffRole: claims.staffRole,
    message: 'Usuario staff provisionado correctamente'
  };
});

interface UpdateStaffInput {
  uid: string;
  nombre?: string;
  telefono?: string;
  perfil?: string;
  activo?: boolean;
  email?: string;
}

/** Callable (solo admin): actualiza Usuarios + AuthPerfiles y re-sincroniza claims. */
export const updateStaffUser = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerAdmin = await isCallerAdmin(request.auth.uid, request.auth.token);
  if (!callerAdmin) {
    throw new HttpsError('permission-denied', 'Solo administradores pueden editar usuarios.');
  }

  const data = request.data as UpdateStaffInput;
  const uid = String(data.uid || '').trim();
  if (!uid) {
    throw new HttpsError('invalid-argument', 'uid es requerido.');
  }

  const usuarioSnap = await db.ref(`Katzen/Usuarios/${uid}`).once('value');
  if (!usuarioSnap.exists()) {
    throw new HttpsError('not-found', 'Usuario no encontrado.');
  }

  const perfilOperativo = data.perfil
    ? String(data.perfil).toLowerCase()
    : String(usuarioSnap.val()?.perfil || 'doctor').toLowerCase();
  const staffRole = mapUsuarioPerfilToStaffRole(perfilOperativo);

  const usuarioUpdates: Record<string, unknown> = {
    staffRole,
    updated_at: new Date().toISOString(),
    updated_by: request.auth.uid
  };
  if (data.nombre !== undefined) usuarioUpdates.nombre = String(data.nombre).trim();
  if (data.telefono !== undefined) usuarioUpdates.telefono = String(data.telefono).trim();
  if (data.perfil !== undefined) usuarioUpdates.perfil = perfilOperativo;
  if (data.activo !== undefined) usuarioUpdates.activo = !!data.activo;
  if (data.email !== undefined) usuarioUpdates.correo = String(data.email).trim().toLowerCase();

  const authPerfilUpdates: Record<string, unknown> = {
    staffRole,
    activo: data.activo !== undefined ? !!data.activo : true
  };
  if (data.email !== undefined) authPerfilUpdates.email = String(data.email).trim().toLowerCase();

  await db.ref(`Katzen/Usuarios/${uid}`).update(usuarioUpdates);
  await db.ref(`Katzen/AuthPerfiles/${uid}`).update(authPerfilUpdates);

  if (data.email !== undefined) {
    await admin.auth().updateUser(uid, { email: String(data.email).trim().toLowerCase() });
  }
  if (data.activo === false) {
    await admin.auth().updateUser(uid, { disabled: true });
  } else if (data.activo === true) {
    await admin.auth().updateUser(uid, { disabled: false });
  }

  const claims = await syncClaimsForUid(uid);

  return {
    success: true,
    uid,
    staffRole: claims.staffRole,
    message: 'Usuario actualizado'
  };
});

interface LinkStaffPortalInput {
  staffUid: string;
  clienteId: string;
}

/**
 * Callable (solo admin): vincula un Cliente existente a un staff (perfil dual).
 * Misma cuenta Auth → admin + portal. No crea Auth nuevo ni envía password.
 */
export const linkStaffPortalCliente = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerAdmin = await isCallerAdmin(request.auth.uid, request.auth.token);
  if (!callerAdmin) {
    throw new HttpsError('permission-denied', 'Solo administradores pueden vincular portal dual.');
  }

  const data = request.data as LinkStaffPortalInput;
  const staffUid = String(data?.staffUid || '').trim();
  const clienteId = String(data?.clienteId || '').trim();
  if (!staffUid || !clienteId) {
    throw new HttpsError('invalid-argument', 'staffUid y clienteId son requeridos.');
  }

  const usuarioSnap = await db.ref(`Katzen/Usuarios/${staffUid}`).once('value');
  if (!usuarioSnap.exists()) {
    throw new HttpsError('not-found', 'Personal staff no encontrado.');
  }
  if (usuarioSnap.val()?.activo === false) {
    throw new HttpsError('failed-precondition', 'El personal staff está inactivo.');
  }

  const perfilSnap = await db.ref(`Katzen/AuthPerfiles/${staffUid}`).once('value');
  const perfilExistente = (perfilSnap.val() || {}) as AuthPerfil;
  if (perfilSnap.exists() && perfilExistente.activo === false) {
    throw new HttpsError('failed-precondition', 'El perfil de acceso del staff está inactivo.');
  }

  const cliente = await loadCliente(clienteId);
  if (cliente['activo'] === false) {
    throw new HttpsError('failed-precondition', 'El cliente está inactivo.');
  }

  const existingAuthUid = String(cliente['authUid'] || '').trim();
  if (existingAuthUid && existingAuthUid !== staffUid) {
    throw new HttpsError(
      'already-exists',
      'Este cliente ya está vinculado a otra cuenta. Desactiva ese portal antes de vincular dual.'
    );
  }

  // Otro AuthPerfil no debe apuntar al mismo clienteId
  const allPerfiles = await db.ref('Katzen/AuthPerfiles').once('value');
  const perfilesVal = allPerfiles.val() as Record<string, AuthPerfil> | null;
  if (perfilesVal) {
    for (const [uid, p] of Object.entries(perfilesVal)) {
      if (uid === staffUid) continue;
      if (p?.clienteId === clienteId && p.activo !== false) {
        throw new HttpsError(
          'already-exists',
          'Otro perfil de acceso ya usa este cliente. Revisa AuthPerfiles.'
        );
      }
    }
  }

  const email =
    String(perfilExistente.email || usuarioSnap.val()?.correo || '').trim().toLowerCase() ||
    correoClienteValido(cliente['correo']);

  const staffRole =
    perfilExistente.staffRole ||
    mapUsuarioPerfilToStaffRole(String(usuarioSnap.val()?.perfil || 'doctor'));

  const timestamp = new Date().toISOString();
  const authPerfilUpdates: AuthPerfil = {
    authUid: staffUid,
    email: email || undefined,
    role: 'dual',
    roles: ['staff', 'client'],
    staffRole,
    clienteId,
    activo: true
  };

  await db.ref(`Katzen/AuthPerfiles/${staffUid}`).update(authPerfilUpdates);
  await db.ref(`Katzen/Cliente/${clienteId}`).update({
    authUid: staffUid,
    portalActivo: true,
    portalLinkedAt: timestamp,
    portalLinkedBy: request.auth.uid,
    portalEmail: email || correoClienteValido(cliente['correo']) || null
  });

  const claims = await syncClaimsForUid(staffUid);

  await db.ref('Katzen/PortalProvisionLog').push({
    action: 'link_staff_dual',
    clienteId,
    uid: staffUid,
    email: email || null,
    emailSent: false,
    createdAt: timestamp,
    createdBy: request.auth.uid
  });

  return {
    success: true,
    uid: staffUid,
    clienteId,
    dualAccess: claims.dualAccess === true,
    message: 'Perfil dual vinculado. El personal puede entrar al portal con la misma cuenta.'
  };
});

interface ProvisionPortalClientInput {
  clienteId: string;
}

async function loadCliente(clienteId: string): Promise<Record<string, unknown>> {
  const snap = await db.ref(`Katzen/Cliente/${clienteId}`).once('value');
  if (!snap.exists()) {
    throw new HttpsError('not-found', 'Cliente no encontrado.');
  }
  return { id: clienteId, ...(snap.val() as Record<string, unknown>) };
}

function clienteNombre(cliente: Record<string, unknown>): string {
  return [cliente['nombre'], cliente['apellidoPaterno'], cliente['apellidoMaterno']]
    .filter(Boolean)
    .join(' ')
    .trim() || 'Cliente';
}

function correoClienteValido(raw: unknown): string {
  const v = String(raw || '').trim().toLowerCase();
  if (!v) return '';
  if (v === 'n/p' || v === 'n/a') return '';
  if (v.includes('no proporcionado') || v.includes('sin email') || v.includes('sin correo')) {
    return '';
  }
  return v;
}

async function assertClienteProvisionable(
  cliente: Record<string, unknown>,
  email: string
): Promise<void> {
  if (cliente['activo'] === false) {
    throw new HttpsError('failed-precondition', 'El cliente está inactivo.');
  }
  if (cliente['authUid'] && cliente['portalActivo'] === true) {
    throw new HttpsError('already-exists', 'Este cliente ya tiene acceso al portal.');
  }

  const dupSnap = await db.ref('Katzen/Cliente')
    .orderByChild('correo')
    .equalTo(email)
    .once('value');
  const dupVal = dupSnap.val() as Record<string, Record<string, unknown>> | null;
  if (dupVal) {
    for (const [otherId, other] of Object.entries(dupVal)) {
      if (
        otherId !== String(cliente['id']) &&
        other.activo !== false &&
        other.authUid &&
        other.portalActivo === true
      ) {
        throw new HttpsError('already-exists', 'Ya existe otro cliente activo con este correo en el portal.');
      }
    }
  }

  try {
    const existing = await admin.auth().getUserByEmail(email);
    const linkedAuthUid = String(cliente['authUid'] || '');
    if (existing.uid !== linkedAuthUid) {
      throw new HttpsError('already-exists', 'Este correo ya está registrado en otra cuenta.');
    }
  } catch (err: unknown) {
    const code = (err as { code?: string }).code;
    if (code !== 'auth/user-not-found') {
      if (err instanceof HttpsError) throw err;
      const message = err instanceof Error ? err.message : 'No se pudo validar el correo.';
      throw new HttpsError('internal', message);
    }
  }
}

/** Callable (solo admin): crea acceso portal para un cliente existente. */
export const provisionPortalClient = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerAdmin = await isCallerAdmin(request.auth.uid, request.auth.token);
  if (!callerAdmin) {
    throw new HttpsError('permission-denied', 'Solo administradores pueden activar el portal de clientes.');
  }

  const clienteId = String((request.data as ProvisionPortalClientInput)?.clienteId || '').trim();
  if (!clienteId) {
    throw new HttpsError('invalid-argument', 'clienteId es requerido.');
  }

  const cliente = await loadCliente(clienteId);
  const email = correoClienteValido(cliente['correo']);
  if (!email) {
    throw new HttpsError('failed-precondition', 'El cliente no tiene correo válido. Agrégalo en Clientes primero.');
  }

  await assertClienteProvisionable(cliente, email);

  const password = generateSecurePassword(16);
  const timestamp = new Date().toISOString();
  const nombre = clienteNombre(cliente);
  let uid = String(cliente['authUid'] || '');
  let createdNewAuth = false;

  try {
    if (uid) {
      await admin.auth().updateUser(uid, {
        email,
        password,
        disabled: false,
        displayName: nombre
      });
    } else {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: nombre,
        disabled: false
      });
      uid = userRecord.uid;
      createdNewAuth = true;
    }

    const authPerfil: AuthPerfil = {
      authUid: uid,
      email,
      role: 'client',
      roles: ['client'],
      clienteId,
      activo: true,
      mustChangePassword: true
    };

    await db.ref(`Katzen/AuthPerfiles/${uid}`).set(authPerfil);
    await db.ref(`Katzen/Cliente/${clienteId}`).update({
      authUid: uid,
      portalActivo: true,
      portalProvisionedAt: timestamp,
      portalProvisionedBy: request.auth.uid,
      portalEmail: email,
      mustChangePassword: true
    });

    await syncClaimsForUid(uid);

    const mail = await sendPortalWelcomeEmail({ to: email, nombre, password });

    await db.ref(`Katzen/PortalProvisionLog`).push({
      action: 'provision',
      clienteId,
      uid,
      email,
      emailSent: mail.sent,
      emailReason: mail.reason || null,
      createdAt: timestamp,
      createdBy: request.auth.uid
    });

    return {
      success: true,
      uid,
      clienteId,
      email,
      emailSent: mail.sent,
      message: mail.sent
        ? 'Portal activado. El cliente recibirá un correo con su contraseña temporal.'
        : `Portal activado. ${mail.reason || 'Configure el envío de correo.'}`
    };
  } catch (err: unknown) {
    if (createdNewAuth && uid) {
      await admin.auth().deleteUser(uid).catch(() => undefined);
    }
    if (err instanceof HttpsError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'No se pudo activar el portal.';
    throw new HttpsError('internal', message);
  }
});

interface PortalClienteActionInput {
  clienteId: string;
}

/** Callable (solo admin): desactiva acceso al portal sin borrar datos del cliente. */
export const deactivatePortalClient = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerAdmin = await isCallerAdmin(request.auth.uid, request.auth.token);
  if (!callerAdmin) {
    throw new HttpsError('permission-denied', 'Solo administradores pueden desactivar el portal.');
  }

  const clienteId = String((request.data as PortalClienteActionInput)?.clienteId || '').trim();
  if (!clienteId) {
    throw new HttpsError('invalid-argument', 'clienteId es requerido.');
  }

  try {
    const cliente = await loadCliente(clienteId);
    const uid = String(cliente['authUid'] || '');
    if (!uid) {
      throw new HttpsError('failed-precondition', 'Este cliente no tiene cuenta de portal.');
    }

    const timestamp = new Date().toISOString();

    await db.ref(`Katzen/Cliente/${clienteId}`).update({
      portalActivo: false,
      portalDeactivatedAt: timestamp,
      portalDeactivatedBy: request.auth.uid
    });

    await db.ref(`Katzen/AuthPerfiles/${uid}`).update({ activo: false });

    let authUserExists = true;
    try {
      await admin.auth().updateUser(uid, { disabled: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found') {
        authUserExists = false;
      } else {
        throw err;
      }
    }

    // Revocación inmediata (decisión #18). Si falla: Auth permanece disabled; sin rollback RTDB.
    if (authUserExists) {
      try {
        await admin.auth().revokeRefreshTokens(uid);
      } catch (revokeErr: unknown) {
        console.error('[deactivatePortalClient] revokeRefreshTokens falló; Auth permanece disabled', {
          uid,
          clienteId,
          error: revokeErr instanceof Error ? revokeErr.message : revokeErr
        });
        // Claims + audit ya reflejan desactivación; no revertir disabled.
        await syncClaimsForUid(uid).catch((syncErr: unknown) => {
          console.error('[deactivatePortalClient] syncClaims tras revoke fallido', syncErr);
        });
        await db.ref(`Katzen/PortalProvisionLog`).push({
          action: 'deactivate',
          clienteId,
          uid,
          createdAt: timestamp,
          createdBy: request.auth.uid,
          revokeRefreshTokensFailed: true
        }).catch(() => undefined);
        throw new HttpsError(
          'failed-precondition',
          'El portal quedó desactivado, pero no se pudieron revocar las sesiones activas. Reintenta o contacta soporte.'
        );
      }
    }

    await syncClaimsForUid(uid);

    await db.ref(`Katzen/PortalProvisionLog`).push({
      action: 'deactivate',
      clienteId,
      uid,
      createdAt: timestamp,
      createdBy: request.auth.uid
    });

    return { success: true, message: 'Acceso al portal desactivado.' };
  } catch (err: unknown) {
    if (err instanceof HttpsError) throw err;
    const message = err instanceof Error ? err.message : 'No se pudo desactivar el portal.';
    throw new HttpsError('internal', message);
  }
});

/** Callable (solo admin): nueva contraseña temporal + correo. */
export const resendPortalClientAccess = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const callerAdmin = await isCallerAdmin(request.auth.uid, request.auth.token);
  if (!callerAdmin) {
    throw new HttpsError('permission-denied', 'Solo administradores pueden reenviar acceso.');
  }

  const clienteId = String((request.data as PortalClienteActionInput)?.clienteId || '').trim();
  if (!clienteId) {
    throw new HttpsError('invalid-argument', 'clienteId es requerido.');
  }

  try {
    const cliente = await loadCliente(clienteId);
    const uid = String(cliente['authUid'] || '');
    const email =
      correoClienteValido(cliente['correo']) || correoClienteValido(cliente['portalEmail']);

    if (!uid) {
      throw new HttpsError('failed-precondition', 'Este cliente no tiene cuenta de portal configurada.');
    }
    if (!email) {
      throw new HttpsError('failed-precondition', 'El cliente no tiene correo válido para reenviar acceso.');
    }

    try {
      await admin.auth().getUser(uid);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/user-not-found') {
        throw new HttpsError(
          'failed-precondition',
          'La cuenta Auth del cliente no existe. Vuelve a activar el portal desde Pendientes.'
        );
      }
      throw err;
    }

    const password = generateSecurePassword(16);
    const nombre = clienteNombre(cliente);
    const timestamp = new Date().toISOString();

    await admin.auth().updateUser(uid, { password, disabled: false, email });
    await db.ref(`Katzen/AuthPerfiles/${uid}`).update({ activo: true, mustChangePassword: true, email });
    await db.ref(`Katzen/Cliente/${clienteId}`).update({
      portalActivo: true,
      mustChangePassword: true,
      portalAccessResentAt: timestamp
    });
    await syncClaimsForUid(uid);

    const mail = await sendPortalWelcomeEmail({ to: email, nombre, password });

    await db.ref(`Katzen/PortalProvisionLog`).push({
      action: 'resend',
      clienteId,
      uid,
      email,
      emailSent: mail.sent,
      emailReason: mail.reason || null,
      createdAt: timestamp,
      createdBy: request.auth.uid
    });

    return {
      success: true,
      emailSent: mail.sent,
      message: mail.sent
        ? 'Se envió un nuevo correo con contraseña temporal.'
        : `Contraseña actualizada. ${mail.reason || 'Configure RESEND_API_KEY para envío automático.'}`
    };
  } catch (err: unknown) {
    if (err instanceof HttpsError) throw err;
    const message = err instanceof Error ? err.message : 'No se pudo reenviar el acceso al portal.';
    throw new HttpsError('internal', message);
  }
});

/** Callable: quita obligación de cambio de contraseña tras actualizarla en el portal. */
export const clearMustChangePassword = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Debes iniciar sesión.');
  }

  const uid = request.auth.uid;
  await db.ref(`Katzen/AuthPerfiles/${uid}`).update({ mustChangePassword: false });

  const perfilSnap = await db.ref(`Katzen/AuthPerfiles/${uid}`).once('value');
  const perfil = (perfilSnap.val() || null) as AuthPerfil | null;
  const clienteId = perfil?.clienteId;
  if (clienteId) {
    await db.ref(`Katzen/Cliente/${clienteId}`).update({ mustChangePassword: false });
  }

  await syncClaimsForUid(uid);
  return { success: true, message: 'Contraseña actualizada.' };
});
