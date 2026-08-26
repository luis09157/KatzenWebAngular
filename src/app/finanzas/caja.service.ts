import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError } from 'rxjs';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import {
  CAJA_CATEGORIA_LABELS,
  CajaCategoria,
  CajaChartBar,
  CajaDiaKpis,
  CajaEgresoDesglose,
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

  /**
   * Rango inclusivo YYYY-MM-DD para el modo (día / semana lun–dom / mes).
   * `valor`: día → YYYY-MM-DD; semana → cualquier día de la semana; mes → YYYY-MM.
   */
  rangoPeriodo(modo: CajaPeriodoModo, valor: string): { desde: string; hasta: string } | null {
    if (!valor) return null;
    if (modo === 'dia') {
      return { desde: valor, hasta: valor };
    }
    if (modo === 'mes') {
      const prefix = valor.length >= 7 ? valor.slice(0, 7) : valor;
      const [y, m] = prefix.split('-').map(Number);
      if (!y || !m) return null;
      const lastDay = new Date(y, m, 0).getDate();
      return {
        desde: `${prefix}-01`,
        hasta: `${prefix}-${String(lastDay).padStart(2, '0')}`
      };
    }
    // semana: lunes–domingo de la fecha de referencia
    const ref = this.parseLocalDate(valor.slice(0, 10));
    if (!ref) return null;
    const day = ref.getDay(); // 0=dom
    const diffToMon = day === 0 ? -6 : 1 - day;
    const lun = new Date(ref);
    lun.setDate(ref.getDate() + diffToMon);
    const dom = new Date(lun);
    dom.setDate(lun.getDate() + 6);
    return { desde: this.formatLocalDate(lun), hasta: this.formatLocalDate(dom) };
  }

  /** Filtra por día, semana (lun–dom) o mes. */
  filtrarPorPeriodo(
    movimientos: CajaMovimiento[],
    modo: CajaPeriodoModo,
    valor: string
  ): CajaMovimiento[] {
    const rango = this.rangoPeriodo(modo, valor);
    if (!rango) return [];
    return movimientos.filter((m) => {
      if (m.activo === false) return false;
      const f = String(m.fecha || '');
      return f >= rango.desde && f <= rango.hasta;
    });
  }

  /** KPIs del período. */
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

  /** Barras resumen: ingresos, egresos, ganancia (neto). Spec 022 C. */
  chartResumen(kpis: CajaDiaKpis): CajaChartBar[] {
    return [
      { label: 'Ingresos', value: kpis.totalIngresos, tone: 'ok' },
      { label: 'Egresos', value: kpis.totalEgresos, tone: 'egreso' },
      {
        label: 'Ganancia',
        value: kpis.neto,
        tone: kpis.neto >= 0 ? 'ok' : 'warn'
      }
    ];
  }

  /** Desglose de egresos por categoría. */
  desgloseEgresos(
    movimientos: CajaMovimiento[],
    modo: CajaPeriodoModo,
    valor: string
  ): CajaEgresoDesglose[] {
    const delPeriodo = this.filtrarPorPeriodo(movimientos, modo, valor).filter(
      (m) => m.tipo === 'egreso'
    );
    const map = new Map<string, number>();
    for (const m of delPeriodo) {
      const key = m.categoria || 'sin_categoria';
      map.set(key, (map.get(key) || 0) + (Number(m.monto) || 0));
    }
    return Array.from(map.entries())
      .map(([categoria, total]) => ({
        categoria: categoria as CajaCategoria | 'sin_categoria',
        label:
          categoria === 'sin_categoria'
            ? 'Sin categoría'
            : CAJA_CATEGORIA_LABELS[categoria as CajaCategoria] || categoria,
        total
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Serie temporal para gráficas: por día del período (semana/mes) o un solo punto (día).
   */
  serieDiaria(
    movimientos: CajaMovimiento[],
    modo: CajaPeriodoModo,
    valor: string
  ): { fecha: string; ingresos: number; egresos: number; ganancia: number }[] {
    const rango = this.rangoPeriodo(modo, valor);
    if (!rango) return [];
    const days: string[] = [];
    const cur = this.parseLocalDate(rango.desde);
    const end = this.parseLocalDate(rango.hasta);
    if (!cur || !end) return [];
    while (cur <= end) {
      days.push(this.formatLocalDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    const filtrados = this.filtrarPorPeriodo(movimientos, modo, valor);
    return days.map((fecha) => {
      const delDia = filtrados.filter((m) => m.fecha === fecha);
      const ingresos = delDia
        .filter((m) => m.tipo === 'ingreso')
        .reduce((a, m) => a + (Number(m.monto) || 0), 0);
      const egresos = delDia
        .filter((m) => m.tipo === 'egreso')
        .reduce((a, m) => a + (Number(m.monto) || 0), 0);
      return { fecha, ingresos, egresos, ganancia: ingresos - egresos };
    });
  }

  /** @deprecated Preferir calcularKpisPeriodo('dia', fecha). */
  calcularKpisDia(movimientos: CajaMovimiento[], fechaDia: string): CajaDiaKpis {
    return this.calcularKpisPeriodo(movimientos, 'dia', fechaDia);
  }

  hoyLocalIsoDate(): string {
    return this.formatLocalDate(new Date());
  }

  mesLocalIso(): string {
    return this.hoyLocalIsoDate().slice(0, 7);
  }

  private parseLocalDate(iso: string): Date | null {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return null;
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  private formatLocalDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
