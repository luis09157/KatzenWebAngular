/**
 * Push FCM desde recordatorios — spec 023.
 * MVP: al crear/actualizar recordatorio pendiente+activo → inbox portal + intento FCM.
 * Sin tokens o sin Messaging usable → no rompe; escribe pushStatus y return.
 */
import * as admin from 'firebase-admin';
import { onValueWritten } from 'firebase-functions/v2/database';
import { logger } from 'firebase-functions';

function rtdb(): admin.database.Database {
  return admin.database();
}

interface RecordatorioSnap {
  paciente_id?: string;
  titulo?: string;
  descripcion?: string;
  estado?: string;
  activo?: boolean;
  fecha_hora_recordatorio?: string;
  fecha_recordatorio?: string;
  notifId?: string;
  pushAt?: string;
  pushStatus?: string;
  pushFingerprint?: string;
}

function fingerprint(r: RecordatorioSnap): string {
  return [
    r.estado || '',
    r.activo === false ? '0' : '1',
    r.titulo || '',
    r.fecha_hora_recordatorio || r.fecha_recordatorio || ''
  ].join('|');
}

async function resolveClienteIdFromPaciente(pacienteId: string): Promise<string | null> {
  const snap = await rtdb().ref(`Katzen/Mascota/${pacienteId}`).once('value');
  const m = snap.val() as { idCliente?: string; cliente_id?: string } | null;
  if (!m) return null;
  return m.idCliente || m.cliente_id || null;
}

async function resolveAuthUidForCliente(clienteId: string): Promise<string | null> {
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

async function createInboxNotificacion(
  clienteId: string,
  recordatorioId: string,
  r: RecordatorioSnap
): Promise<string> {
  const ref = rtdb().ref(`Katzen/Notificaciones/${clienteId}`).push();
  await ref.set({
    tipo: 'recordatorio',
    titulo: r.titulo || 'Recordatorio',
    mensaje: r.descripcion || 'Tienes un recordatorio pendiente.',
    fecha: new Date().toISOString(),
    leida: false,
    mascotaId: r.paciente_id || null,
    referenciaId: recordatorioId
  });
  return ref.key!;
}

async function collectActiveTokens(authUid: string): Promise<string[]> {
  const snap = await rtdb().ref(`Katzen/FcmTokens/${authUid}`).once('value');
  const map = snap.val() as
    | Record<string, { token?: string; activo?: boolean }>
    | null;
  if (!map) return [];
  const tokens: string[] = [];
  for (const entry of Object.values(map)) {
    if (entry?.token && entry.activo !== false) {
      tokens.push(entry.token);
    }
  }
  return tokens;
}

async function deactivateToken(authUid: string, token: string): Promise<void> {
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

export const onRecordatorioWritePush = onValueWritten(
  {
    ref: '/Katzen/Recordatorios/{recordatorioId}',
    region: 'us-central1'
  },
  async (event) => {
    const after = event.data.after.val() as RecordatorioSnap | null;
    const before = event.data.before.val() as RecordatorioSnap | null;
    const recordatorioId = event.params.recordatorioId as string;

    if (!after || after.activo === false || after.estado !== 'pendiente') {
      return;
    }

    const fp = fingerprint(after);
    if (before && fingerprint(before) === fp && after.pushAt) {
      return;
    }
    if (after.pushFingerprint === fp && after.pushStatus && after.pushStatus !== 'failed') {
      return;
    }

    const pacienteId = after.paciente_id;
    if (!pacienteId) {
      logger.warn('Recordatorio sin paciente_id', { recordatorioId });
      return;
    }

    let clienteId: string | null = null;
    try {
      clienteId = await resolveClienteIdFromPaciente(pacienteId);
    } catch (err) {
      logger.error('No se pudo resolver cliente desde mascota', err);
      return;
    }
    if (!clienteId) {
      await rtdb().ref(`Katzen/Recordatorios/${recordatorioId}`).update({
        pushStatus: 'skipped_no_cliente',
        pushAt: new Date().toISOString(),
        pushFingerprint: fp
      });
      return;
    }

    let notifId = after.notifId;
    try {
      if (!notifId) {
        notifId = await createInboxNotificacion(clienteId, recordatorioId, after);
      }
    } catch (err) {
      logger.error('Fallo inbox Notificaciones', err);
    }

    let authUid: string | null = null;
    try {
      authUid = await resolveAuthUidForCliente(clienteId);
    } catch (err) {
      logger.warn('No authUid para cliente', { clienteId, err });
    }

    if (!authUid) {
      await rtdb().ref(`Katzen/Recordatorios/${recordatorioId}`).update({
        notifId: notifId || null,
        pushStatus: 'skipped_no_tokens',
        pushAt: new Date().toISOString(),
        pushFingerprint: fp
      });
      return;
    }

    const tokens = await collectActiveTokens(authUid);
    if (tokens.length === 0) {
      await rtdb().ref(`Katzen/Recordatorios/${recordatorioId}`).update({
        notifId: notifId || null,
        pushStatus: 'skipped_no_tokens',
        pushAt: new Date().toISOString(),
        pushFingerprint: fp
      });
      return;
    }

    try {
      const messaging = admin.messaging();
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: after.titulo || 'Recordatorio KatzenVet',
          body: after.descripcion || 'Tienes un recordatorio pendiente.'
        },
        data: {
          tipo: 'recordatorio',
          recordatorioId,
          pacienteId,
          clienteId
        }
      });

      response.responses.forEach((res, idx) => {
        if (
          !res.success &&
          res.error &&
          (res.error.code === 'messaging/registration-token-not-registered' ||
            res.error.code === 'messaging/invalid-registration-token')
        ) {
          void deactivateToken(authUid!, tokens[idx]);
        }
      });

      const successCount = response.successCount;
      const status =
        successCount === 0
          ? 'failed'
          : successCount < tokens.length
            ? 'partial'
            : 'sent';

      await rtdb().ref(`Katzen/Recordatorios/${recordatorioId}`).update({
        notifId: notifId || null,
        pushStatus: status,
        pushAt: new Date().toISOString(),
        pushFingerprint: fp
      });
    } catch (err) {
      logger.error('FCM send failed (MVP safe)', err);
      await rtdb().ref(`Katzen/Recordatorios/${recordatorioId}`).update({
        notifId: notifId || null,
        pushStatus: 'failed',
        pushAt: new Date().toISOString(),
        pushFingerprint: fp
      });
    }
  }
);
