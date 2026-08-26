import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError } from 'rxjs';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import {
  CajaDiaKpis,
  CajaMetodoPago,
  CajaMovimiento,
  CajaMovimientoFormData
} from './caja.models';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly movimientosPath = 'Katzen/Caja/Movimientos';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  getMovimientos(): Observable<CajaMovimiento[]> {
    return this.db
      .list<CajaMovimiento>(this.movimientosPath)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key!, ...(c.payload.val() as CajaMovimiento) }))
            .filter((m) => m.activo !== false)
            .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')) || String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
        ),
        catchError((error) => {
          console.error('Error al obtener movimientos de caja:', error);
          return throwError(() => error);
        })
      );
  }

  async crearMovimiento(data: CajaMovimientoFormData): Promise<string> {
    const now = new Date().toISOString();
    const createdBy = await this.currentStaff.getStaffId();
    const movimiento: CajaMovimiento = {
      tipo: data.tipo,
      monto: Number(data.monto),
      metodoPago: data.metodoPago,
      ivaDeclarado: !!data.ivaDeclarado,
      concepto: String(data.concepto || '').trim(),
      fecha: data.fecha,
      activo: true,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    // RTDB no acepta `undefined` en push — solo añadir opcionales con valor.
    if (data.banioId) {
      movimiento.banioId = data.banioId;
    }
    if (data.notas?.trim()) {
      movimiento.notas = data.notas.trim();
    }

    const ref = await this.db.list<CajaMovimiento>(this.movimientosPath).push(movimiento);
    await stampRtdbIdAfterPush(this.db, this.movimientosPath, ref.key);
    return ref.key!;
  }

  async bajaLogicaMovimiento(id: string): Promise<void> {
    await this.db.object(`${this.movimientosPath}/${id}`).update({
      activo: false,
      updatedAt: new Date().toISOString()
    });
  }

  /** KPIs del día (fecha local YYYY-MM-DD). */
  calcularKpisDia(movimientos: CajaMovimiento[], fechaDia: string): CajaDiaKpis {
    const delDia = movimientos.filter((m) => m.fecha === fechaDia && m.activo !== false);
    const sum = (pred: (m: CajaMovimiento) => boolean) =>
      delDia.filter(pred).reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

    const totalIngresos = sum((m) => m.tipo === 'ingreso');
    const totalEgresos = sum((m) => m.tipo === 'egreso');
    const porMetodo = (metodo: CajaMetodoPago) =>
      sum((m) => m.tipo === 'ingreso' && m.metodoPago === metodo);

    return {
      totalIngresos,
      totalEgresos,
      neto: totalIngresos - totalEgresos,
      efectivo: porMetodo('efectivo'),
      tarjeta: porMetodo('tarjeta'),
      transferencia: porMetodo('transferencia'),
      ivaDeclarado: sum((m) => m.tipo === 'ingreso' && m.ivaDeclarado === true),
      ivaNoDeclarado: sum((m) => m.tipo === 'ingreso' && m.ivaDeclarado !== true),
      movimientosActivos: delDia.length
    };
  }

  hoyLocalIsoDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
