const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const util = require('../lib/push-schedule.util');

describe('push-schedule.util (052 ola 2)', () => {
  it('isVaccineReminder por tipo y origen', () => {
    assert.equal(util.isVaccineReminder({ tipo: 'vacuna' }), true);
    assert.equal(util.isVaccineReminder({ origen: 'vacuna_auto' }), true);
    assert.equal(util.isVaccineReminder({ tipo: 'baño' }), false);
    assert.equal(util.isVaccineReminder({ tipo: 'medicamento' }), false);
  });

  it('isDewormReminder por tipo y origen (053)', () => {
    assert.equal(util.isDewormReminder({ tipo: 'desparasitacion' }), true);
    assert.equal(util.isDewormReminder({ origen: 'desparasitacion_auto' }), true);
    assert.equal(util.isDewormReminder({ tipo: 'vacuna' }), false);
    assert.equal(util.isSchedulerReminder({ tipo: 'desparasitacion' }), true);
  });

  it('isMascotaFallecido respeta 017', () => {
    assert.equal(util.isMascotaFallecido({ estado: 'Fallecido' }), true);
    assert.equal(util.isMascotaFallecido({ estado: 'fallecido' }), true);
    assert.equal(util.isMascotaFallecido({ estado: 'Activo' }), false);
  });

  it('daysUntilDue usa YYYY-MM-DD', () => {
    const now = new Date('2026-08-28T16:00:00Z');
    const days = util.daysUntilDue(
      { fecha_hora_recordatorio: '2026-09-04 09:00:00' },
      now,
      'America/Mexico_City'
    );
    assert.equal(days, 7);
  });

  it('D-0 y D-7 son las ventanas; D-1 no dispara', () => {
    const now = new Date('2026-08-28T16:00:00Z');
    assert.equal(
      util.windowKindForReminder({ fecha_hora_recordatorio: '2026-09-04 09:00:00' }, now),
      'd7'
    );
    assert.equal(
      util.windowKindForReminder({ fecha_hora_recordatorio: '2026-08-28 09:00:00' }, now),
      'd0'
    );
    assert.equal(
      util.windowKindForReminder({ fecha_hora_recordatorio: '2026-08-29 09:00:00' }, now),
      null
    );
  });

  it('SC-019: refuerzo a 1 año se diferirá al write', () => {
    const now = new Date('2026-08-28T16:00:00Z');
    const far = {
      tipo: 'vacuna',
      origen: 'vacuna_auto',
      estado: 'pendiente',
      activo: true,
      fecha_hora_recordatorio: '2027-08-28 09:00:00'
    };
    assert.equal(util.shouldDeferVaccineWritePush(far, now), true);
  });

  it('vacuna a 3 días NO se diferirá (ventana ≤8, 023 puede avisar)', () => {
    const now = new Date('2026-08-28T16:00:00Z');
    const near = {
      tipo: 'vacuna',
      estado: 'pendiente',
      activo: true,
      fecha_hora_recordatorio: '2026-08-31 09:00:00'
    };
    assert.equal(util.shouldDeferVaccineWritePush(near, now), false);
  });

  it('baño nunca se diferirá (023 al write)', () => {
    const now = new Date('2026-08-28T16:00:00Z');
    const banio = {
      tipo: 'baño',
      estado: 'pendiente',
      activo: true,
      fecha_hora_recordatorio: '2027-08-28 09:00:00'
    };
    assert.equal(util.shouldDeferVaccineWritePush(banio, now), false);
  });

  it('tope 2 pushes y no reenvía el mismo kind', () => {
    const r = {
      pushCount: 1,
      pushKindsSent: { d7: '2026-08-21T10:00:00.000Z' }
    };
    assert.equal(util.canSendKind(r, 'd7'), false);
    assert.equal(util.canSendKind(r, 'd0'), true);
    assert.equal(util.canSendKind({ pushCount: 2 }, 'd0'), false);
  });

  it('agrupa spam dueño: 2 mascotas → 1 copy', () => {
    const copy = util.ownerPushCopy([
      { titulo: 'Refuerzo rabia', mascotaNombre: 'Luna', kind: 'd0' },
      { titulo: 'Refuerzo DHPP', mascotaNombre: 'Max', kind: 'd0' }
    ]);
    assert.match(copy.title, /Hoy 2 vacunas/);
    assert.match(copy.body, /Luna/);
    assert.match(copy.body, /Max/);
  });

  it('staff resumen Hoy N vacunas', () => {
    const copy = util.staffPushCopy('d0', 3);
    assert.equal(copy.title, 'Hoy 3 vacunas');
  });

  it('quiet hours 23–08', () => {
    const night = new Date('2026-08-29T05:30:00Z'); // 23:30 Mexico UTC-6
    assert.equal(util.isQuietHours(night, 'America/Mexico_City'), true);
    const morning = new Date('2026-08-28T16:00:00Z'); // 10:00 Mexico
    assert.equal(util.isQuietHours(morning, 'America/Mexico_City'), false);
  });
});
