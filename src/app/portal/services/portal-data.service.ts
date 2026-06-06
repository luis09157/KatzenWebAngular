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
  mapVacuna
} from '../utils/portal-mapper.util';

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
    const snap = await firstValueFrom(
      this.db.list('Katzen/Mascota', ref =>
        ref.orderByChild('idCliente').equalTo(clienteId)
      ).snapshotChanges().pipe(take(1))
    );

    return snap
      .map(a => mapMascota(a.key!, a.payload.val() as Record<string, unknown>))
      .filter(m => m.activo);
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
    if (!mascota || String(mascota.idCliente) !== String(clienteId)) {
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
    const [vacunas, citas, historiales] = await Promise.all([
      this.getVacunasPorMascota(mascotaId),
      this.getCitasPorMascota(mascotaId),
      this.getHistorialesPorMascota(mascotaId)
    ]);
    return { vacunas: vacunas.length, citas: citas.length, historiales: historiales.length };
  }
}
