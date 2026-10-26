import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { TarifasPeluqueria, normalizarTarifasPeluqueria } from './tarifas-peluqueria.util';

/** `Katzen/Finanzas/TarifasPeluqueria` — aditivo (2026-10-26). */
@Injectable({ providedIn: 'root' })
export class TarifasPeluqueriaService {
  private readonly path = 'Katzen/Finanzas/TarifasPeluqueria';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  async getOnce(): Promise<TarifasPeluqueria> {
    const snap = await this.db.database.ref(this.path).once('value');
    return normalizarTarifasPeluqueria(snap.val());
  }

  async guardar(data: TarifasPeluqueria): Promise<void> {
    const limpio = normalizarTarifasPeluqueria(data);
    const staffId = await this.currentStaff.getStaffId();
    await this.db.object(this.path).set({
      filas: limpio.filas,
      updatedAt: new Date().toISOString(),
      updatedBy: staffId || 'system',
    });
  }
}
