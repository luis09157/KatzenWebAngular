import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, catchError, map, of } from 'rxjs';
import { InversionMetaConfig } from '../models/clinic-config.model';
import { CurrentStaffService } from './current-staff.service';

@Injectable({ providedIn: 'root' })
export class ClinicConfigService {
  private readonly inversionMetaPath = 'Katzen/Config/inversionMeta';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  getInversionMeta$(): Observable<InversionMetaConfig | null> {
    return this.db
      .object<InversionMetaConfig>(this.inversionMetaPath)
      .valueChanges()
      .pipe(
        map((v) => v ?? null),
        catchError(() => of(null))
      );
  }

  async saveInversionMeta(montoMeta: number): Promise<void> {
    const monto = Number(montoMeta);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new Error('El monto meta debe ser mayor a cero.');
    }
    const updatedBy = await this.currentStaff.getStaffId();
    const payload: InversionMetaConfig = {
      montoMeta: monto,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || undefined
    };
    await this.db.object(this.inversionMetaPath).set(payload);
  }
}
