import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { buildPensionEstanciaCreatePayload, omitUndefinedRtdb } from './pension-estancia-payload.util';
import { PensionEstancia, PensionEstanciaFormData } from './pension.models';

@Injectable({ providedIn: 'root' })
export class PensionService {
  private readonly path = 'Katzen/Pension/Estancias';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  getEstancias(): Observable<PensionEstancia[]> {
    return this.db
      .list<PensionEstancia>(this.path)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key!, ...(c.payload.val() as PensionEstancia) }))
            .filter((e) => e.activo !== false)
            .sort((a, b) => String(b.fecha_ingreso || '').localeCompare(String(a.fecha_ingreso || '')))
        )
      );
  }

  async crearEstancia(data: PensionEstanciaFormData): Promise<string> {
    const staffId = await this.currentStaff.getStaffId();
    const now = new Date().toISOString();
    const dias = this.calcularDias(data.fecha_ingreso, data.fecha_salida_prevista);
    const payload = buildPensionEstanciaCreatePayload({
      ...data,
      dias,
      now,
      staffId: staffId || 'system',
    }) as unknown as PensionEstancia;
    const ref = await this.db.list<PensionEstancia>(this.path).push(payload);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    return ref.key!;
  }

  async actualizarEstancia(id: string, patch: Partial<PensionEstancia>): Promise<void> {
    const safe = omitUndefinedRtdb({
      ...(patch as Record<string, unknown>),
      updated_at: new Date().toISOString(),
    });
    await this.db.object(`${this.path}/${id}`).update(safe);
  }

  async bajaLogicaEstancia(id: string): Promise<void> {
    await this.actualizarEstancia(id, { activo: false, estado: 'cancelada' });
  }

  calcularDias(ingreso: string, salida?: string): number {
    if (!ingreso) return 1;
    if (!salida) return 1;
    const a = new Date(`${ingreso}T12:00:00`);
    const b = new Date(`${salida}T12:00:00`);
    const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  }
}
