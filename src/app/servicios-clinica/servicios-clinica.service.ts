import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { ServicioClinica, ServicioClinicaFormData } from './servicios-clinica.models';
import {
  hidratarServicioClinica,
  normalizarTipoServicioClinica,
  ordenarServiciosClinica,
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
              return hidratarServicioClinica(raw, c.payload.key || raw.id);
            })
          )
        ),
        catchError(() => of([]))
      );
  }

  async crear(data: ServicioClinicaFormData): Promise<string> {
    const staffId = await this.currentStaff.getStaffId();
    const now = new Date().toISOString();
    const aplicaIva = data.aplicaIva === true;
    const esDomicilio = data.esDomicilio === true;
    const payload = this.sucursal.stamp({
      nombre: String(data.nombre || '').trim(),
      // Spec 093: altas nuevas nunca escriben tipo domicilio.
      tipo: normalizarTipoServicioClinica(data.tipo),
      esDomicilio,
      precio_venta: Math.max(0, Number(data.precio_venta) || 0),
      precio_costo: Math.max(0, Number(data.precio_costo) || 0),
      aplicaIva,
      tasaIva: aplicaIva ? Math.max(0, Number(data.tasaIva) || 16) : 0,
      notas: String(data.notas || '').trim(),
      activo: data.activo !== false,
      created_at: now,
      updated_at: now,
      created_by: staffId || 'system',
    }) as ServicioClinica;
    const ref = await this.db.list<ServicioClinica>(this.path).push(payload);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    return ref.key!;
  }

  async actualizar(id: string, patch: Partial<ServicioClinica>): Promise<void> {
    const clean: Partial<ServicioClinica> = { ...patch, updated_at: new Date().toISOString() };
    if (patch.tipo != null) {
      // Escritura: tipo clínico (nunca domicilio).
      clean.tipo = normalizarTipoServicioClinica(patch.tipo);
    }
    if (patch.esDomicilio != null) {
      clean.esDomicilio = patch.esDomicilio === true;
    }
    if (patch.precio_venta != null) {
      clean.precio_venta = Math.max(0, Number(patch.precio_venta) || 0);
    }
    if (patch.precio_costo != null) {
      clean.precio_costo = Math.max(0, Number(patch.precio_costo) || 0);
    }
    if (patch.aplicaIva != null) {
      clean.aplicaIva = patch.aplicaIva === true;
      clean.tasaIva = clean.aplicaIva ? Math.max(0, Number(patch.tasaIva != null ? patch.tasaIva : 16) || 16) : 0;
    } else if (patch.tasaIva != null) {
      clean.tasaIva = Math.max(0, Number(patch.tasaIva) || 0);
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
