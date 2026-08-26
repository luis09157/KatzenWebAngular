import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError } from 'rxjs';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import {
  CajaDiaKpis,
  CajaMetodoPago,
  CajaMovimiento,
  CajaMovimientoFormData,
  CajaPeriodoModo
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
            .sort(
              (a, b) =>
                String(b.fecha || '').localeCompare(String(a.fecha || '')) ||
                String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
            )
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
    const monto = Number(data.monto);
    const costo =
      data.costoAsociado != null && !Number.isNaN(Number(data.costoAsociado))
        ? Number(data.costoAsociado)
        : undefined;

    const movimiento: CajaMovimiento = {
      tipo: data.tipo,
      monto,
      metodoPago: data.metodoPago,
      ivaDeclarado: !!data.ivaDeclarado,
      concepto: String(data.concepto || '').trim(),
      fecha: data.fecha,
      activo: true,
      createdAt: now,
      updatedAt: now,
      createdBy
    };

    if (data.banioId) {
      movimiento.banioId = data.banioId;
    }
    if (data.notas?.trim()) {
      movimiento.notas = data.notas.trim();
    }
    if (data.categoria) {
      movimiento.categoria = data.categoria;
    }
    if (data.plantillaCostoId) {
      movimiento.plantillaCostoId = data.plantillaCostoId;
    }
    if (costo != null && costo >= 0) {
      movimiento.costoAsociado = costo;
      if (data.tipo === 'ingreso') {
        movimiento.margenEstimado = Math.round((monto - costo) * 100) / 100;
      }
    }
    if (data.movimientoInventarioIds?.length) {
      movimiento.movimientoInventarioIds = [...data.movimientoInventarioIds];
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

  /** Filtra por día (YYYY-MM-DD) o mes (YYYY-MM). */
  filtrarPorPeriodo(
    movimientos: CajaMovimiento[],
    modo: CajaPeriodoModo,
    valor: string
  ): CajaMovimiento[] {
    if (!valor) return [];
    if (modo === 'dia') {
      return movimientos.filter((m) => m.fecha === valor && m.activo !== false);
    }
    const prefix = valor.length >= 7 ? valor.slice(0, 7) : valor;
    return movimientos.filter(
      (m) => m.activo !== false && String(m.fecha || '').startsWith(prefix)
    );
  }

  /** KPIs del período (día o mes). */
  calcularKpisPeriodo(
    movimientos: CajaMovimiento[],
    modo: CajaPeriodoModo,
    valor: string
  ): CajaDiaKpis {
    const delPeriodo = this.filtrarPorPeriodo(movimientos, modo, valor);
    const sum = (pred: (m: CajaMovimiento) => boolean) =>
      delPeriodo.filter(pred).reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

    const totalIngresos = sum((m) => m.tipo === 'ingreso');
    const totalEgresos = sum((m) => m.tipo === 'egreso');
    const porMetodo = (metodo: CajaMetodoPago) =>
      sum((m) => m.tipo === 'ingreso' && m.metodoPago === metodo);

    const conCosto = delPeriodo.filter(
      (m) => m.tipo === 'ingreso' && m.costoAsociado != null && !Number.isNaN(Number(m.costoAsociado))
    );
    const totalCostosAsociados = conCosto.reduce(
      (acc, m) => acc + (Number(m.costoAsociado) || 0),
      0
    );
    const margenEstimado = conCosto.reduce((acc, m) => {
      if (m.margenEstimado != null) return acc + Number(m.margenEstimado);
      return acc + ((Number(m.monto) || 0) - (Number(m.costoAsociado) || 0));
    }, 0);
    const ingresosConCosto = conCosto.reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
    const ingresosSinCosto = totalIngresos - ingresosConCosto;

    return {
      totalIngresos,
      totalEgresos,
      neto: totalIngresos - totalEgresos,
      efectivo: porMetodo('efectivo'),
      tarjeta: porMetodo('tarjeta'),
      transferencia: porMetodo('transferencia'),
      ivaDeclarado: sum((m) => m.tipo === 'ingreso' && m.ivaDeclarado === true),
      ivaNoDeclarado: sum((m) => m.tipo === 'ingreso' && m.ivaDeclarado !== true),
      movimientosActivos: delPeriodo.length,
      totalCostosAsociados,
      margenEstimado,
      ingresosConCosto,
      ingresosSinCosto
    };
  }

  /** @deprecated Preferir calcularKpisPeriodo('dia', fecha). */
  calcularKpisDia(movimientos: CajaMovimiento[], fechaDia: string): CajaDiaKpis {
    return this.calcularKpisPeriodo(movimientos, 'dia', fechaDia);
  }

  hoyLocalIsoDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  mesLocalIso(): string {
    return this.hoyLocalIsoDate().slice(0, 7);
  }
}
