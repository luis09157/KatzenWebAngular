/**
 * Scheduler diario ~10:00 America/Mexico_City — spec 052 ola 2.
 * Envía FCM + inbox cuando el recordatorio de vacuna está en D-7 o D-0.
 * Agrupa por dueño (1 push si varias mascotas) y 1 resumen staff.
 *
 * Deploy (solo con autorización Luis):
 *   firebase deploy --only functions:fcm:onVacunaPushSchedule
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import {
  RecordatorioPushFields,
  canSendKind,
  groupByClienteId,
  isMascotaFallecido,
  isPendingActive,
  isQuietHours,
  isVaccineReminder,
  ownerPushCopy,
  PushKind,
  pushCountOf,
  staffPushCopy,
  windowKindForReminder
} from './push-schedule.util';
import {
  collectActiveTokens,
  collectStaffTokens,
  createClinicaInbox,
  createInboxNotificacion,
  fingerprint,
  loadMascota,
  resolveAuthUidForCliente,
  rtdb,
  sendMulticast
} from './fcm-helpers';

interface DueItem {
  id: string;
  r: RecordatorioPushFields;
  kind: PushKind;
  clienteId: string | null;
  pacienteId: string;
  mascotaNombre: string;
}

async function markRecordatorioPush(
  id: string,
  r: RecordatorioPushFields,
  kind: PushKind,
  extra: { pushStatus: string; notifId?: string | null }
): Promise<void> {
  const nowIso = new Date().toISOString();
  const kinds = { ...(r.pushKindsSent || {}) };
  kinds[kind] = nowIso;
  const count = pushCountOf(r) + 1;
  const both = !!(kinds.d7 && kinds.d0);
  await rtdb()
    .ref(`Katzen/Recordatorios/${id}`)
    .update({
      pushStatus: extra.pushStatus,
      pushAt: nowIso,
      pushFingerprint: fingerprint(r),
      pushCount: count,
      pushKindsSent: kinds,
      pushDueStatus: both ? 'complete' : `${kind}_sent`,
      skipPushOnCreate: true,
      ...(extra.notifId ? { notifId: extra.notifId } : {})
    });
}

async function notifyOwnerGroup(
  clienteId: string,
  items: DueItem[],
  skipFcm: boolean
): Promise<void> {
  const copy = ownerPushCopy(
    items.map((i) => ({
      titulo: i.r.titulo,
      mascotaNombre: i.mascotaNombre,
      kind: i.kind
    }))
  );

  let notifId: string | null = null;
  try {
    notifId = await createInboxNotificacion(clienteId, items[0].id, items[0].r, {
      tipo: 'recordatorio_vacuna',
      titulo: copy.title,
      mensaje: copy.body
    });
  } catch (err) {
    logger.error('Inbox dueño (scheduler) falló', { clienteId, err });
  }

  let pushStatus = 'skipped_no_tokens';
  if (!skipFcm) {
    const authUid = await resolveAuthUidForCliente(clienteId);
    if (authUid) {
      const tokens = await collectActiveTokens(authUid);
      if (tokens.length > 0) {
        const result = await sendMulticast({
          tokens,
          tokenUids: tokens.map(() => authUid),
          title: copy.title,
          body: copy.body,
          data: {
            tipo: 'recordatorio_vacuna',
            clienteId,
            recordatorioId: items[0].id,
            kind: items[0].kind
          }
        });
        pushStatus = result.status;
      }
    }
  } else {
    pushStatus = 'inbox_only_quiet_hours';
  }

  for (const item of items) {
    await markRecordatorioPush(item.id, item.r, item.kind, {
      pushStatus,
      notifId
    });
  }
}

async function notifyStaffSummary(
  kind: PushKind,
  items: DueItem[],
  skipFcm: boolean
): Promise<void> {
  if (items.length === 0) return;
  const copy = staffPushCopy(kind, items.length);
  try {
    await createClinicaInbox({
      titulo: copy.title,
      mensaje: copy.body,
      kind,
      recordatorioIds: items.map((i) => i.id),
      count: items.length
    });
  } catch (err) {
    logger.error('Inbox clínica (scheduler) falló', err);
  }

  if (skipFcm) return;

  const staffTokens = await collectStaffTokens();
  if (staffTokens.length === 0) {
    logger.info('Scheduler vacuna: staff sin tokens FCM', { kind, count: items.length });
    return;
  }
  await sendMulticast({
    tokens: staffTokens.map((t) => t.token),
    tokenUids: staffTokens.map((t) => t.uid),
    title: copy.title,
    body: copy.body,
    data: {
      tipo: 'vacuna_resumen_clinica',
      kind,
      count: String(items.length)
    }
  });
}

export async function runVacunaPushSchedule(now: Date = new Date()): Promise<{
  due: number;
  owners: number;
}> {
  const skipFcm = isQuietHours(now);
  const snap = await rtdb().ref('Katzen/Recordatorios').once('value');
  const all = snap.val() as Record<string, RecordatorioPushFields> | null;
  if (!all) {
    return { due: 0, owners: 0 };
  }

  const due: DueItem[] = [];
  for (const [id, r] of Object.entries(all)) {
    if (!isPendingActive(r) || !isVaccineReminder(r)) continue;
    const kind = windowKindForReminder(r, now);
    if (!kind || !canSendKind(r, kind)) continue;

    const pacienteId = String(r.paciente_id || '').trim();
    if (!pacienteId) continue;

    let mascota: Awaited<ReturnType<typeof loadMascota>> = null;
    try {
      mascota = await loadMascota(pacienteId);
    } catch (err) {
      logger.error('Scheduler: no se pudo leer mascota', { id, pacienteId, err });
      continue;
    }
    if (isMascotaFallecido(mascota)) {
      await rtdb().ref(`Katzen/Recordatorios/${id}`).update({
        pushDueStatus: 'skipped_fallecido',
        pushAt: new Date().toISOString(),
        skipPushOnCreate: true
      });
      continue;
    }

    const clienteId = mascota?.idCliente || mascota?.cliente_id || null;
    due.push({
      id,
      r,
      kind,
      clienteId,
      pacienteId,
      mascotaNombre: String(mascota?.nombre || '').trim() || 'Mascota'
    });
  }

  const byCliente = groupByClienteId(due);
  for (const [clienteId, items] of byCliente) {
    await notifyOwnerGroup(clienteId, items, skipFcm);
  }

  const orph = due.filter((i) => !i.clienteId);
  for (const item of orph) {
    await markRecordatorioPush(item.id, item.r, item.kind, {
      pushStatus: 'skipped_no_cliente'
    });
  }

  await notifyStaffSummary(
    'd0',
    due.filter((i) => i.kind === 'd0'),
    skipFcm
  );
  await notifyStaffSummary(
    'd7',
    due.filter((i) => i.kind === 'd7'),
    skipFcm
  );

  logger.info('onVacunaPushSchedule listo', {
    due: due.length,
    owners: byCliente.size,
    skipFcm
  });
  return { due: due.length, owners: byCliente.size };
}

export const onVacunaPushSchedule = onSchedule(
  {
    schedule: '0 10 * * *',
    timeZone: 'America/Mexico_City',
    region: 'us-central1'
  },
  async () => {
    await runVacunaPushSchedule(new Date());
  }
);
