/**
 * Push FCM desde recordatorios — spec 023 + gate 052 ola 2.
 * MVP: al crear/actualizar recordatorio pendiente+activo → inbox portal + intento FCM.
 * Vacuna con fecha lejana (> 8 días): NO FCM/inbox al write; el scheduler diario avisa en D-7/D-0.
 * Baño / meds / otros: comportamiento 023 intacto.
 */
import { onValueWritten } from 'firebase-functions/v2/database';
import { logger } from 'firebase-functions';
import { RecordatorioPushFields, shouldDeferVaccineWritePush, windowKindForReminder } from './push-schedule.util';
import {
  collectActiveTokens,
  createInboxNotificacion,
  fingerprint,
  resolveAuthUidForCliente,
  resolveClienteIdFromPaciente,
  rtdb,
  sendMulticast
} from './fcm-helpers';

export const onRecordatorioWritePush = onValueWritten(
  {
    ref: '/Katzen/Recordatorios/{recordatorioId}',
    region: 'us-central1'
  },
  async (event) => {
    const after = event.data.after.val() as RecordatorioPushFields | null;
    const before = event.data.before.val() as RecordatorioPushFields | null;
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

    if (shouldDeferVaccineWritePush(after, new Date())) {
      await rtdb().ref(`Katzen/Recordatorios/${recordatorioId}`).update({
        skipPushOnCreate: true,
        pushDueStatus: 'deferred',
        pushStatus: 'scheduled',
        pushAt: new Date().toISOString(),
        pushFingerprint: fp,
        pushCount: after.pushCount || 0
      });
      logger.info('Vacuna: push diferido al scheduler (fecha lejana)', { recordatorioId });
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

    let notifId = (after as { notifId?: string }).notifId;
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

    const result = await sendMulticast({
      tokens,
      tokenUids: tokens.map(() => authUid!),
      title: after.titulo || 'Recordatorio KatzenVet',
      body: after.descripcion || 'Tienes un recordatorio pendiente.',
      data: {
        tipo: 'recordatorio',
        recordatorioId,
        pacienteId,
        clienteId
      }
    });

    const vaccineKind = windowKindForReminder(after, new Date());
    const vaccineMeta =
      vaccineKind != null
        ? {
            skipPushOnCreate: true,
            pushCount: 1,
            pushKindsSent: { ...(after.pushKindsSent || {}), [vaccineKind]: new Date().toISOString() },
            pushDueStatus: `${vaccineKind}_sent`
          }
        : {};

    await rtdb().ref(`Katzen/Recordatorios/${recordatorioId}`).update({
      notifId: notifId || null,
      pushStatus: result.status,
      pushAt: new Date().toISOString(),
      pushFingerprint: fp,
      ...vaccineMeta
    });
  }
);
