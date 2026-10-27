import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { TarifasDomicilio, normalizarTarifasDomicilio } from './domicilio-cotizacion.util';

/** `Katzen/Finanzas/TarifasDomicilio` — aditivo (spec 107). Sin datos → valores de la app. */
@Injectable({ providedIn: 'root' })
export class TarifasDomicilioService {
  private readonly path = 'Katzen/Finanzas/TarifasDomicilio';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  async getOnce(): Promise<TarifasDomicilio> {
    const snap = await this.db.database.ref(this.path).once('value');
    return normalizarTarifasDomicilio(snap.val());
  }

  watch(): Observable<TarifasDomicilio> {
    return this.db
      .object(this.path)
      .valueChanges()
      .pipe(map((v) => normalizarTarifasDomicilio(v)));
  }

  async guardar(data: TarifasDomicilio): Promise<void> {
    const limpio = normalizarTarifasDomicilio(data);
    const staffId = await this.currentStaff.getStaffId();
    const tipos: Record<string, unknown> = {};
    limpio.tipos.forEach((t, i) => {
      tipos[t.id] = {
        nombre: t.nombre,
        recorridos: t.recorridos,
        margenPct: t.margenPct,
        activo: t.activo !== false,
        orden: i + 1,
        ...(t.nombreApp ? { nombreApp: t.nombreApp } : {}),
      };
    });
    await this.db.object(this.path).set({
      precioLitro: limpio.precioLitro,
      kmPorLitro: limpio.kmPorLitro,
      redondeo: limpio.redondeo,
      tipos,
      updated_at: new Date().toISOString(),
      updated_by: staffId || 'system',
    });
  }
}
