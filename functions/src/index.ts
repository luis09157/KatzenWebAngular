import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onValueWritten } from 'firebase-functions/v2/database';
import { setGlobalOptions } from 'firebase-functions/v2';

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
}

interface StaffClaims {
  role: string;
  staffRole?: string;
  clienteId?: string;
  dualAccess?: boolean;
}

function mapUsuarioPerfilToStaffRole(perfil: string | undefined): string {
  const p = String(perfil || '').toLowerCase();
  if (p === 'admin' || p === 'administrador') return 'administrador';
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
    dualAccess: staffAccess && clientAccess
  };
}

async function isCallerAdmin(uid: string, token: admin.auth.DecodedIdToken): Promise<boolean> {
  const staffRole = String(token.staffRole || '').toLowerCase();
  if (staffRole === 'administrador' || staffRole === 'admin') {
    return true;
  }

  const snap = await db.ref(`Katzen/Usuarios/${uid}/perfil`).once('value');
  const perfil = String(snap.val() || '').toLowerCase();
  return perfil === 'administrador' || perfil === 'admin';
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
