import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  isActiveRecord,
  isVisibleInClientPortal,
  mapCita,
  mapHistorial,
  mapMascota,
  mapNotificacion,
  mapBanio,
  mapPension,
  mapRecordatorio,
  mapVisita,
  mapVacuna
} from '../utils/portal-mapper.util';
import { pacientePerteneceACliente } from '../../core/utils/paciente-cliente.util';

@Injectable({ providedIn: 'root' })
export class PortalDataService {
  constructor(private db: AngularFireDatabase) {}

  async getCliente(clienteId: string): Promise<Record<string, unknown> | null> {
    const val = await firstValueFrom(
      this.db.object(`Katzen/Cliente/${clienteId}`).valueChanges().pipe(take(1))
    );
    return val && typeof val === 'object' ? (val as Record<string, unknown>) : null;
  }

  async getMascotasActivas(clienteId: string) {
    const [byIdCliente, byClienteId] = await Promise.all([
      firstValueFrom(
        this.db.list('Katzen/Mascota', ref =>
          ref.orderByChild('idCliente').equalTo(clienteId)
        ).snapshotChanges().pipe(take(1))
      ),
      firstValueFrom(
        this.db.list('Katzen/Mascota', ref =>
          ref.orderByChild('cliente_id').equalTo(clienteId)
        ).snapshotChanges().pipe(take(1))
      )
    ]);

    const seen = new Set<string>();
    const mascotas = [];

    for (const snap of [...byIdCliente, ...byClienteId]) {
      if (!snap.key || seen.has(snap.key)) {
        continue;
      }
      seen.add(snap.key);
      const mapped = mapMascota(snap.key, snap.payload.val() as Record<string, unknown>);
      if (mapped.activo) {
        mascotas.push(mapped);
      }
    }

    return mascotas;
  }

  async getMascota(mascotaId: string) {
    const val = await firstValueFrom(
      this.db.object(`Katzen/Mascota/${mascotaId}`).valueChanges().pipe(take(1))
    );
    if (!val || typeof val !== 'object') return null;
    const mapped = mapMascota(mascotaId, val as Record<string, unknown>);
    return mapped.activo ? mapped : null;
  }

  async getMascotaForCliente(mascotaId: string, clienteId: string) {
    const mascota = await this.getMascota(mascotaId);
    if (!mascota || !pacientePerteneceACliente(mascota as { cliente_id?: string; idCliente?: string }, clienteId)) {
      return null;
    }
    return mascota;
  }

  async getVacunasPorMascota(mascotaId: string) {
    const snap = await firstValueFrom(
      this.db.list('Katzen/Vacunas', ref =>
        ref.orderByChild('idPaciente').equalTo(mascotaId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .filter(a => isActiveRecord(a.payload.val() as Record<string, unknown>))
      .map(a => mapVacuna(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  async getCitasPorMascota(mascotaId: string) {
    const snap = await firstValueFrom(
      this.db.list('Katzen/Citas', ref =>
        ref.orderByChild('paciente_id').equalTo(mascotaId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .filter(a => isActiveRecord(a.payload.val() as Record<string, unknown>))
      .map(a => mapCita(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => String(b.fecha_hora).localeCompare(String(a.fecha_hora)));
  }

  async getBaniosPorMascota(mascotaId: string) {
    const snap = await firstValueFrom(
      this.db.list('Katzen/Banios', ref =>
        ref.orderByChild('paciente_id').equalTo(mascotaId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .filter(a => isActiveRecord(a.payload.val() as Record<string, unknown>))
      .map(a => mapBanio(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => {
        const fa = `${String(b.fecha_banio)} ${String(b.hora_banio)}`;
        const fb = `${String(a.fecha_banio)} ${String(a.hora_banio)}`;
        return fa.localeCompare(fb);
      });
  }

  async getPensionPorMascota(mascotaId: string) {
    const snap = await firstValueFrom(
      this.db.list('Katzen/Pension/Estancias', ref =>
        ref.orderByChild('paciente_id').equalTo(mascotaId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .filter(a => isActiveRecord(a.payload.val() as Record<string, unknown>))
      .map(a => mapPension(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => String(b.fecha_ingreso).localeCompare(String(a.fecha_ingreso)));
  }

  async getRecordatoriosPorMascota(mascotaId: string) {
    const snap = await firstValueFrom(
      this.db.list('Katzen/Recordatorios', ref =>
        ref.orderByChild('paciente_id').equalTo(mascotaId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .filter(a => isActiveRecord(a.payload.val() as Record<string, unknown>))
      .map(a => mapRecordatorio(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  async getVisitasPorMascota(mascotaId: string) {
    const snap = await firstValueFrom(
      this.db.list('Katzen/Visitas', ref =>
        ref.orderByChild('paciente_id').equalTo(mascotaId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .filter(a => isActiveRecord(a.payload.val() as Record<string, unknown>))
      .map(a => mapVisita(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  async getHistorialesPorMascota(mascotaId: string) {
    const snap = await firstValueFrom(
      this.db.list('Katzen/Historiales_Clinicos', ref =>
        ref.orderByChild('paciente_id').equalTo(mascotaId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .filter(a => isVisibleInClientPortal(a.payload.val() as Record<string, unknown>))
      .map(a => mapHistorial(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => String(b.fecha_registro).localeCompare(String(a.fecha_registro)));
  }

  async getNotificaciones(clienteId: string) {
    const snap = await firstValueFrom(
      this.db.list(`Katzen/Notificaciones/${clienteId}`).snapshotChanges().pipe(take(1))
    );

    return snap
      .map(a => mapNotificacion(a.key!, a.payload.val() as Record<string, unknown>))
      .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }

  async marcarNotificacionLeida(clienteId: string, notifId: string): Promise<void> {
    await this.db.object(`Katzen/Notificaciones/${clienteId}/${notifId}`).update({ leida: true });
  }

  async getCounts(mascotaId: string) {
    const [vacunas, citas, historiales, banos, pension, recordatorios, visitas] = await Promise.all([
      this.getVacunasPorMascota(mascotaId),
      this.getCitasPorMascota(mascotaId),
      this.getHistorialesPorMascota(mascotaId),
      this.getBaniosPorMascota(mascotaId),
      this.getPensionPorMascota(mascotaId),
      this.getRecordatoriosPorMascota(mascotaId),
      this.getVisitasPorMascota(mascotaId)
    ]);
    return {
      vacunas: vacunas.length,
      citas: citas.length,
      historiales: historiales.length,
      banos: banos.length,
      pension: pension.length,
      recordatorios: recordatorios.length,
      visitas: visitas.length,
      saldoPendiente: visitas.reduce((s, v) => s + Math.max(0, Number(v.saldo) || 0), 0)
    };
  }
}
