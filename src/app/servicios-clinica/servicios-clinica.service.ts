import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { ServicioClinica, ServicioClinicaFormData } from './servicios-clinica.models';
import {
  normalizarTipoServicioClinica,
  ordenarServiciosClinica
} from './servicios-clinica.util';

@Injectable({ providedIn: 'root' })
export class ServiciosClinicaService {
  private readonly path = 'Katzen/ServiciosClinica';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService,
    private sucursal: SucursalContextService
  ) {}

  getServicios(): Observable<ServicioClinica[]> {
    return this.db
      .list<ServicioClinica>(this.path)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          ordenarServiciosClinica(
            changes.map((c) => {
              const raw = (c.payload.val() || {}) as ServicioClinica;
              return {
                ...raw,
                id: c.payload.key || raw.id,
                tipo: normalizarTipoServicioClinica(raw.tipo),
                precio_venta: Number(raw.precio_venta) || 0,
                activo: raw.activo !== false,
                nombre: String(raw.nombre || '').trim()
              };
            })
          )
        ),
        catchError(() => of([]))
      );
  }

  async crear(data: ServicioClinicaFormData): Promise<string> {
    const staffId = await this.currentStaff.getStaffId();
    const now = new Date().toISOString();
    const payload = this.sucursal.stamp({
      nombre: String(data.nombre || '').trim(),
      tipo: normalizarTipoServicioClinica(data.tipo),
      precio_venta: Math.max(0, Number(data.precio_venta) || 0),
      notas: String(data.notas || '').trim(),
      activo: data.activo !== false,
      created_at: now,
      updated_at: now,
      created_by: staffId || 'system'
    }) as ServicioClinica;
    const ref = await this.db.list<ServicioClinica>(this.path).push(payload);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    return ref.key!;
  }

  async actualizar(id: string, patch: Partial<ServicioClinica>): Promise<void> {
    const clean: Partial<ServicioClinica> = { ...patch, updated_at: new Date().toISOString() };
    if (patch.tipo != null) {
      clean.tipo = normalizarTipoServicioClinica(patch.tipo);
    }
    if (patch.precio_venta != null) {
      clean.precio_venta = Math.max(0, Number(patch.precio_venta) || 0);
    }
    if (patch.nombre != null) {
      clean.nombre = String(patch.nombre).trim();
    }
    await this.db.object(`${this.path}/${id}`).update(clean);
  }

  async bajaLogica(id: string): Promise<void> {
    await this.actualizar(id, { activo: false });
  }
}
