import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import {
  Consentimiento,
  ConsentimientoEstado,
  ConsentimientoFormData,
  ConsentimientoTipo
} from './consentimientos.models';
import { hoyLocalIsoDate } from './consentimientos.util';

@Injectable({ providedIn: 'root' })
export class ConsentimientosService {
  private readonly path = 'Katzen/Consentimientos';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  getConsentimientos(): Observable<Consentimiento[]> {
    return this.db
      .list<Consentimiento>(this.path)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => this.normalize(c.payload.key!, c.payload.val() as Consentimiento))
            .filter((r) => r.activo !== false)
            .sort(
              (a, b) =>
                String(b.fecha || '').localeCompare(String(a.fecha || '')) ||
                String(b.created_at || '').localeCompare(String(a.created_at || ''))
            )
        )
      );
  }

  getPorPaciente(pacienteId: string): Observable<Consentimiento[]> {
    return this.db
      .list<Consentimiento>(this.path, (ref) =>
        ref.orderByChild('paciente_id').equalTo(pacienteId)
      )
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => this.normalize(c.payload.key!, c.payload.val() as Consentimiento))
            .filter((r) => r.activo !== false)
            .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
        )
      );
  }

  async getById(id: string): Promise<Consentimiento | null> {
    const val = await firstValueFrom(
      this.db.object<Consentimiento>(`${this.path}/${id}`).valueChanges().pipe(take(1))
    );
    if (!val) return null;
    return this.normalize(id, val);
  }

  async crear(data: ConsentimientoFormData): Promise<string> {
    const staffId = await this.currentStaff.getStaffId();
    const now = new Date().toISOString();
    const payload: Consentimiento = {
      cliente_id: data.cliente_id,
      cliente: data.cliente || '',
      paciente_id: data.paciente_id,
      paciente: data.paciente || '',
      tipo: data.tipo,
      fecha: data.fecha || hoyLocalIsoDate(),
      firmado_por: (data.firmado_por || '').trim(),
      parentesco: data.parentesco || '',
      staff_uid: data.staff_uid || undefined,
      staff_nombre: data.staff_nombre || undefined,
      notas: data.notas || '',
      estado: data.estado || 'vigente',
      activo: true,
      created_at: now,
      updated_at: now,
      created_by: staffId || 'system'
    };
    const ref = await this.db.list<Consentimiento>(this.path).push(payload);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    return ref.key!;
  }

  async actualizar(id: string, patch: Partial<Consentimiento>): Promise<void> {
    await this.db.object(`${this.path}/${id}`).update({
      ...patch,
      updated_at: new Date().toISOString()
    });
  }

  async bajaLogica(id: string): Promise<void> {
    await this.actualizar(id, { activo: false, estado: 'revocado' });
  }

  private normalize(id: string, raw: Consentimiento): Consentimiento {
    const tipo = (raw?.tipo || 'otro') as ConsentimientoTipo;
    const estado = (raw?.estado || 'vigente') as ConsentimientoEstado;
    return {
      ...raw,
      id,
      cliente_id: String(raw?.cliente_id || ''),
      paciente_id: String(raw?.paciente_id || ''),
      tipo,
      fecha: String(raw?.fecha || ''),
      firmado_por: String(raw?.firmado_por || ''),
      estado,
      activo: raw?.activo !== false
    };
  }
}
