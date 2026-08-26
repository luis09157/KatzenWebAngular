import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentStaffService } from '../core/services/current-staff.service';
import {
  DefaultBanioTamano,
  DefaultsBanioPorTamano,
  TamanoPerroBanio,
  emptyDefaultsBanio
} from './defaults-banio.models';

@Injectable({ providedIn: 'root' })
export class DefaultsBanioService {
  private readonly path = 'Katzen/Finanzas/DefaultsBanioPorTamano';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  getDefaults(): Observable<DefaultsBanioPorTamano> {
    return this.db.object<DefaultsBanioPorTamano>(this.path).valueChanges().pipe(
      map((raw) => this.normalize(raw))
    );
  }

  async getDefaultsOnce(): Promise<DefaultsBanioPorTamano> {
    const snap = await this.db.database.ref(this.path).once('value');
    return this.normalize(snap.val() as DefaultsBanioPorTamano | null);
  }

  async guardarDefaults(data: DefaultsBanioPorTamano): Promise<void> {
    const staffId = await this.currentStaff.getStaffId();
    const payload: DefaultsBanioPorTamano = {
      pequeno: this.sanitizeRow(data.pequeno),
      mediano: this.sanitizeRow(data.mediano),
      grande: this.sanitizeRow(data.grande),
      updatedAt: new Date().toISOString(),
      updatedBy: staffId || 'system'
    };
    await this.db.object(this.path).set(payload);
  }

  defaultParaTamano(
    defaults: DefaultsBanioPorTamano,
    tamano: TamanoPerroBanio | null | undefined
  ): DefaultBanioTamano | null {
    if (!tamano) return null;
    return defaults[tamano] || null;
  }

  private normalize(raw: DefaultsBanioPorTamano | null | undefined): DefaultsBanioPorTamano {
    const base = emptyDefaultsBanio();
    if (!raw) return base;
    return {
      pequeno: this.sanitizeRow(raw.pequeno || base.pequeno),
      mediano: this.sanitizeRow(raw.mediano || base.mediano),
      grande: this.sanitizeRow(raw.grande || base.grande),
      updatedAt: raw.updatedAt,
      updatedBy: raw.updatedBy
    };
  }

  private sanitizeRow(row: DefaultBanioTamano): DefaultBanioTamano {
    const out: DefaultBanioTamano = {
      costoDefault: Math.max(0, Number(row?.costoDefault) || 0)
    };
    if (row?.precioSugerido != null && !Number.isNaN(Number(row.precioSugerido))) {
      out.precioSugerido = Math.max(0, Number(row.precioSugerido));
    }
    if (row?.plantillaCostoId) {
      out.plantillaCostoId = String(row.plantillaCostoId);
    }
    return out;
  }
}
