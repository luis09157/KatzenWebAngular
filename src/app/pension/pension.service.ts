import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
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
    const precioDia = Math.max(0, Number(data.precio_dia) || 0);
    const costoDia =
      data.costo_dia != null && !Number.isNaN(Number(data.costo_dia))
        ? Math.max(0, Number(data.costo_dia))
        : undefined;
    const payload: PensionEstancia = {
      paciente_id: data.paciente_id,
      paciente: data.paciente || '',
      cliente_id: data.cliente_id,
      cliente: data.cliente || '',
      fecha_ingreso: data.fecha_ingreso,
      fecha_salida_prevista: data.fecha_salida_prevista || undefined,
      tamano_mascota: data.tamano_mascota || undefined,
      precio_dia: precioDia,
      precio_total:
        data.precio_total != null && !Number.isNaN(Number(data.precio_total))
          ? Math.max(0, Number(data.precio_total))
          : Math.round(precioDia * dias * 100) / 100,
      costo_dia: costoDia,
      costo_total_estimado:
        costoDia != null ? Math.round(costoDia * dias * 100) / 100 : undefined,
      estado: data.estado || 'reservada',
      notas: data.notas || '',
      activo: true,
      created_at: now,
      updated_at: now,
      created_by: staffId || 'system'
    };
    const ref = await this.db.list<PensionEstancia>(this.path).push(payload);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    return ref.key!;
  }

  async actualizarEstancia(id: string, patch: Partial<PensionEstancia>): Promise<void> {
    await this.db.object(`${this.path}/${id}`).update({
      ...patch,
      updated_at: new Date().toISOString()
    });
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
