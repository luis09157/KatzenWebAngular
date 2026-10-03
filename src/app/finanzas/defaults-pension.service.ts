import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { precioDiaPensionEfectivo } from '../pension/pension-tarifas.util';
import {
  DefaultPensionTamano,
  DefaultsPensionPorTamano,
  TamanoMascotaPensionDefault,
  emptyDefaultsPension,
} from './defaults-pension.models';

@Injectable({ providedIn: 'root' })
export class DefaultsPensionService {
  private readonly path = 'Katzen/Finanzas/DefaultsPensionPorTamano';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  getDefaults(): Observable<DefaultsPensionPorTamano> {
    return this.db
      .object<DefaultsPensionPorTamano>(this.path)
      .valueChanges()
      .pipe(map((raw) => this.normalize(raw)));
  }

  async getDefaultsOnce(): Promise<DefaultsPensionPorTamano> {
    const snap = await this.db.database.ref(this.path).once('value');
    return this.normalize(snap.val() as DefaultsPensionPorTamano | null);
  }

  async guardarDefaults(data: DefaultsPensionPorTamano): Promise<void> {
    const staffId = await this.currentStaff.getStaffId();
    const payload: DefaultsPensionPorTamano = {
      pequeno: this.sanitizeRow('pequeno', data.pequeno),
      mediano: this.sanitizeRow('mediano', data.mediano),
      grande: this.sanitizeRow('grande', data.grande),
      gigante: this.sanitizeRow('gigante', data.gigante),
      updatedAt: new Date().toISOString(),
      updatedBy: staffId || 'system',
    };
    await this.db.object(this.path).set(payload);
  }

  defaultParaTamano(
    defaults: DefaultsPensionPorTamano,
    tamano: TamanoMascotaPensionDefault | null | undefined
  ): DefaultPensionTamano | null {
    if (!tamano) return null;
    return defaults[tamano] || null;
  }

  private normalize(raw: DefaultsPensionPorTamano | null | undefined): DefaultsPensionPorTamano {
    const base = emptyDefaultsPension();
    if (!raw) return base;
    return {
      pequeno: this.sanitizeRow('pequeno', raw.pequeno || base.pequeno),
      mediano: this.sanitizeRow('mediano', raw.mediano || base.mediano),
      grande: this.sanitizeRow('grande', raw.grande || base.grande),
      // Aditivo 089: nodos viejos sin `gigante` → tarifa oficial.
      gigante: this.sanitizeRow('gigante', raw.gigante || base.gigante),
      updatedAt: raw.updatedAt,
      updatedBy: raw.updatedBy,
    };
  }

  private sanitizeRow(tamano: TamanoMascotaPensionDefault, row: DefaultPensionTamano): DefaultPensionTamano {
    const out: DefaultPensionTamano = {
      precioDia: precioDiaPensionEfectivo(tamano, row?.precioDia),
    };
    if (row?.costoDia != null && !Number.isNaN(Number(row.costoDia))) {
      out.costoDia = Math.max(0, Number(row.costoDia));
    }
    if (row?.plantillaCostoId) {
      out.plantillaCostoId = String(row.plantillaCostoId);
    }
    if (row?.productoComidaId) {
      out.productoComidaId = String(row.productoComidaId);
    }
    if (row?.cantidadComidaPorDia != null && !Number.isNaN(Number(row.cantidadComidaPorDia))) {
      out.cantidadComidaPorDia = Math.max(0, Number(row.cantidadComidaPorDia));
    }
    return out;
  }
}
