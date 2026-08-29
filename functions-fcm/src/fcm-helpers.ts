/**
 * Helpers FCM + inbox compartidos (023 + 052 ola 2).
 */
import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions';
import { RecordatorioPushFields } from './push-schedule.util';

export function rtdb(): admin.database.Database {
  return admin.database();
}

export function fingerprint(r: RecordatorioPushFields): string {
  return [
    r.estado || '',
    r.activo === false ? '0' : '1',
    r.titulo || '',
    r.fecha_hora_recordatorio || r.fecha_recordatorio || ''
  ].join('|');
}

export async function resolveClienteIdFromPaciente(pacienteId: string): Promise<string | null> {
  const snap = await rtdb().ref(`Katzen/Mascota/${pacienteId}`).once('value');
  const m = snap.val() as { idCliente?: string; cliente_id?: string } | null;
  if (!m) return null;
  return m.idCliente || m.cliente_id || null;
}

export async function loadMascota(
  pacienteId: string
): Promise<{ idCliente?: string; cliente_id?: string; nombre?: string; estado?: string } | null> {
  const snap = await rtdb().ref(`Katzen/Mascota/${pacienteId}`).once('value');
  return (snap.val() as { idCliente?: string; cliente_id?: string; nombre?: string; estado?: string } | null) || null;
}

export async function resolveAuthUidForCliente(clienteId: string): Promise<string | null> {
  const clienteSnap = await rtdb().ref(`Katzen/Cliente/${clienteId}`).once('value');
  const c = clienteSnap.val() as { authUid?: string; portalUid?: string } | null;
  if (c?.authUid) return c.authUid;
  if (c?.portalUid) return c.portalUid;

  const perfiles = await rtdb().ref('Katzen/AuthPerfiles').once('value');
  const all = perfiles.val() as Record<string, { clienteId?: string; role?: string }> | null;
  if (!all) return null;
  for (const [uid, p] of Object.entries(all)) {
    if (p && p.clienteId === clienteId) return uid;
  }
  return null;
}

export async function createInboxNotificacion(
  clienteId: string,
  recordatorioId: string,
  r: RecordatorioPushFields,
  extras?: { titulo?: string; mensaje?: string; tipo?: string }
): Promise<string> {
  const ref = rtdb().ref(`Katzen/Notificaciones/${clienteId}`).push();
  await ref.set({
    tipo: extras?.tipo || 'recordatorio',
    titulo: extras?.titulo || r.titulo || 'Recordatorio',
    mensaje: extras?.mensaje || r.descripcion || 'Tienes un recordatorio pendiente.',
    fecha: new Date().toISOString(),
    leida: false,
    mascotaId: r.paciente_id || null,
    referenciaId: recordatorioId
  });
  return ref.key!;
}

export async function createClinicaInbox(payload: {
  titulo: string;
  mensaje: string;
  kind: string;
  recordatorioIds: string[];
  count: number;
}): Promise<string> {
  const ref = rtdb().ref('Katzen/NotificacionesClinica').push();
  await ref.set({
    tipo: 'vacuna_resumen',
    titulo: payload.titulo,
    mensaje: payload.mensaje,
    fecha: new Date().toISOString(),
    leida: false,
    kind: payload.kind,
    recordatorioIds: payload.recordatorioIds,
    count: payload.count
  });
  return ref.key!;
}

export async function collectActiveTokens(authUid: string): Promise<string[]> {
  const snap = await rtdb().ref(`Katzen/FcmTokens/${authUid}`).once('value');
  const map = snap.val() as Record<string, { token?: string; activo?: boolean }> | null;
  if (!map) return [];
  const tokens: string[] = [];
  for (const entry of Object.values(map)) {
    if (entry?.token && entry.activo !== false) {
      tokens.push(entry.token);
    }
  }
  return tokens;
}

export async function collectStaffUids(): Promise<string[]> {
  const perfiles = await rtdb().ref('Katzen/AuthPerfiles').once('value');
  const all = perfiles.val() as Record<string, { role?: string }> | null;
  const uids = new Set<string>();
  if (all) {
    for (const [uid, p] of Object.entries(all)) {
      if (p && p.role && p.role !== 'client') {
        uids.add(uid);
      }
    }
  }
  if (uids.size === 0) {
    const usuarios = await rtdb().ref('Katzen/Usuarios').once('value');
    const map = usuarios.val() as Record<string, unknown> | null;
    if (map) {
      for (const uid of Object.keys(map)) {
        uids.add(uid);
      }
    }
  }
  return [...uids];
}

export async function collectStaffTokens(): Promise<Array<{ uid: string; token: string }>> {
  const uids = await collectStaffUids();
  const out: Array<{ uid: string; token: string }> = [];
  for (const uid of uids) {
    const tokens = await collectActiveTokens(uid);
    for (const token of tokens) {
      out.push({ uid, token });
    }
  }
  return out;
}

export async function deactivateToken(authUid: string, token: string): Promise<void> {
  const snap = await rtdb().ref(`Katzen/FcmTokens/${authUid}`).once('value');
  const map = snap.val() as Record<string, { token?: string }> | null;
  if (!map) return;
  for (const [key, entry] of Object.entries(map)) {
    if (entry?.token === token) {
      await rtdb().ref(`Katzen/FcmTokens/${authUid}/${key}`).update({
        activo: false,
        updatedAt: new Date().toISOString()
      });
    }
  }
}

export async function sendMulticast(opts: {
  tokens: string[];
  tokenUids?: string[];
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<{ status: 'sent' | 'partial' | 'failed'; successCount: number }> {
  if (opts.tokens.length === 0) {
    return { status: 'failed', successCount: 0 };
  }
  try {
    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast({
      tokens: opts.tokens,
      notification: {
        title: opts.title,
        body: opts.body
      },
      data: opts.data
    });

    response.responses.forEach((res, idx) => {
      if (
        !res.success &&
        res.error &&
        (res.error.code === 'messaging/registration-token-not-registered' ||
          res.error.code === 'messaging/invalid-registration-token')
      ) {
        const uid = opts.tokenUids?.[idx];
        if (uid) {
          void deactivateToken(uid, opts.tokens[idx]);
        }
      }
    });

    const successCount = response.successCount;
    const status: 'sent' | 'partial' | 'failed' =
      successCount === 0 ? 'failed' : successCount < opts.tokens.length ? 'partial' : 'sent';
    return { status, successCount };
  } catch (err) {
    logger.error('FCM send failed (MVP safe)', err);
    return { status: 'failed', successCount: 0 };
  }
}
