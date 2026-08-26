import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { staffRoleIsVeterinarioOperativo } from '../core/config/staff-role.config';
import {
  CITA_DURACION_DEFAULT_MIN,
  CITA_DURACION_MINIMA_MIN,
  findVeterinarioOverlap,
  resolveDuracionMinutos
} from './cita-agenda.util';

@Injectable({
  providedIn: 'root'
})
export class CitasService {
  constructor(
    private db: AngularFireDatabase,
    private sucursalContext: SucursalContextService,
    private authProfile: AuthProfileService
  ) {}

  getCitas(): Observable<any[]> {
    return this.db.list('Katzen/Citas').snapshotChanges().pipe(
      map(actions => actions
        .map(a => ({
          id: a.key,
          ...a.payload.val() as any
        }))
        .filter(cita => cita.activo !== false)
        .sort((a, b) => {
          const fechaA = new Date(a.fecha || a.fecha_hora || a.created_at || 0);
          const fechaB = new Date(b.fecha || b.fecha_hora || b.created_at || 0);
          return fechaB.getTime() - fechaA.getTime();
        })
      )
    );
  }

  /**
   * Agregar o actualizar cita con reglas de agenda (vet, duración, solape, cancelación, revert).
   */
  async guardarCita(cita: any): Promise<any> {
    const payload: any = { ...cita };
    const isNew = !payload.id;
    if (isNew) {
      payload.activo = true;
    }

    // Campos solo UI de la tabla admin (no persistir)
    delete payload.cliente;
    delete payload.paciente;

    const veterinario = String(payload.veterinario || '').trim();
    if (!veterinario) {
      throw new Error('Debes asignar un veterinario a la cita.');
    }
    payload.veterinario = veterinario;

    let duracion = Number(payload.duracion_minutos);
    if (!Number.isFinite(duracion) || duracion < CITA_DURACION_MINIMA_MIN) {
      duracion = CITA_DURACION_DEFAULT_MIN;
    }
    payload.duracion_minutos = Math.floor(duracion);

    const estado = String(payload.estado || 'pendiente').toLowerCase();
    payload.estado = estado;

    if (estado === 'cancelada') {
      const motivo = String(payload.motivo_cancelacion || '').trim();
      if (!motivo) {
        throw new Error('Indica el motivo de cancelación.');
      }
      payload.motivo_cancelacion = motivo;
    }

    if (!isNew && payload.id) {
      const previaSnap = await firstValueFrom(
        this.db.object(`Katzen/Citas/${payload.id}`).valueChanges().pipe(take(1))
      );
      const previa = previaSnap as Record<string, unknown> | null;
      const estadoPrevio = String(previa?.['estado'] || '').toLowerCase();
      if (estadoPrevio === 'completada' && estado === 'confirmada') {
        const role = await this.authProfile.getEffectiveStaffRole();
        if (!staffRoleIsVeterinarioOperativo(role)) {
          throw new Error('Solo veterinarias pueden revertir una cita completada.');
        }
      }
    }

    const existentes = await firstValueFrom(this.getCitas().pipe(take(1)));
    const conflicto = findVeterinarioOverlap(payload, existentes || []);
    if (conflicto) {
      throw new Error('El veterinario ya tiene una cita en ese horario.');
    }

    if (payload.duracion_minutos == null) {
      payload.duracion_minutos = resolveDuracionMinutos(payload);
    }

    const stamped = this.sucursalContext.stamp(payload);

    if (stamped.id) {
      return this.db.object(`Katzen/Citas/${stamped.id}`).set(stamped);
    }

    const result: any = await this.db.list('Katzen/Citas').push(stamped);
    await this.db.object(`Katzen/Citas/${result.key}`).update({ ...stamped, id: result.key });
    return result;
  }

  async bajaLogicaCita(id: string): Promise<any> {
    return this.db.object(`Katzen/Citas/${id}`).update({
      activo: false,
      fecha_eliminacion: new Date().toISOString()
    });
  }
}
