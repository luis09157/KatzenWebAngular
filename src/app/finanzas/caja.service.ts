import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, firstValueFrom, map, catchError, throwError } from 'rxjs';
import { take } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { debeExcluirRefuerzoIngresoServicio } from '../core/utils/cobro-integridad.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import {
  CAJA_CATEGORIA_LABELS,
  CAJA_CATEGORIAS_INGRESO,
  CajaCategoria,
  CajaChartBar,
  CajaDiaKpis,
  CajaEgresoDesglose,
  CajaIngresoDesglose,
  BanioIngresoRefuerzo,
  PensionIngresoRefuerzo,
  CajaMetodoPago,
  CajaCorte,
  CajaTurno,
  CajaMovimiento,
  CajaMovimientoFormData,
  CajaPeriodoModo,
} from './caja.models';
import { fondoInicialDesdeUltimoCorte, yaHayCorteDelDia } from './caja-turno.util';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private readonly movimientosPath = 'Katzen/Caja/Movimientos';
  private readonly cortesPath = 'Katzen/Caja/Cortes';
  private readonly turnosPath = 'Katzen/Caja/Turnos';

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
      data.costoAsociado != null && !Number.isNaN(Number(data.costoAsociado)) ? Number(data.costoAsociado) : undefined;

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
      createdBy,
    };

    if (data.banioId) {
      movimiento.banioId = data.banioId;
    }
    if (data.citaId) {
      movimiento.citaId = data.citaId;
    }
    if (data.visitaId) {
      movimiento.visitaId = data.visitaId;
    }
    if (data.clienteId) {
      movimiento.clienteId = data.clienteId;
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
    if (data.tipo === 'ingreso') {
      try {
        await this.asegurarTurnoDelDia(data.fecha);
      } catch (err) {
        console.error('Turno de caja no se pudo abrir (el cobro sí quedó):', err);
      }
    }
    return ref.key!;
  }

  async bajaLogicaMovimiento(id: string): Promise<void> {
    await this.db.object(`${this.movimientosPath}/${id}`).update({
      activo: false,
      updatedAt: new Date().toISOString(),
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
        hasta: `${prefix}-${String(lastDay).padStart(2, '0')}`,
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
  filtrarPorPeriodo(movimientos: CajaMovimiento[], modo: CajaPeriodoModo, valor: string): CajaMovimiento[] {
    const rango = this.rangoPeriodo(modo, valor);
    if (!rango) return [];
    return movimientos.filter((m) => {
      if (m.activo === false) return false;
      const f = String(m.fecha || '');
      return f >= rango.desde && f <= rango.hasta;
    });
  }

  /** KPIs del período. */
  calcularKpisPeriodo(movimientos: CajaMovimiento[], modo: CajaPeriodoModo, valor: string): CajaDiaKpis {
    const delPeriodo = this.filtrarPorPeriodo(movimientos, modo, valor);
    const sum = (pred: (m: CajaMovimiento) => boolean) =>
      delPeriodo.filter(pred).reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

    const totalIngresos = sum((m) => m.tipo === 'ingreso');
    const totalEgresos = sum((m) => m.tipo === 'egreso');
    const porMetodo = (metodo: CajaMetodoPago) => sum((m) => m.tipo === 'ingreso' && m.metodoPago === metodo);

    const conCosto = delPeriodo.filter(
      (m) => m.tipo === 'ingreso' && m.costoAsociado != null && !Number.isNaN(Number(m.costoAsociado))
    );
    const totalCostosAsociados = conCosto.reduce((acc, m) => acc + (Number(m.costoAsociado) || 0), 0);
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
      ingresosSinCosto,
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
        tone: kpis.neto >= 0 ? 'ok' : 'warn',
      },
    ];
  }

  /** Desglose de egresos por categoría. */
  desgloseEgresos(movimientos: CajaMovimiento[], modo: CajaPeriodoModo, valor: string): CajaEgresoDesglose[] {
    const delPeriodo = this.filtrarPorPeriodo(movimientos, modo, valor).filter((m) => m.tipo === 'egreso');
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
        total,
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Ingresos por categoría/servicio. Refuerza baños y pensión sin movimiento de caja (028 / 031).
   */
  desgloseIngresosPorServicio(
    movimientos: CajaMovimiento[],
    modo: CajaPeriodoModo,
    valor: string,
    banios: BanioIngresoRefuerzo[] = [],
    pensiones: PensionIngresoRefuerzo[] = []
  ): CajaIngresoDesglose[] {
    const delPeriodo = this.filtrarPorPeriodo(movimientos, modo, valor).filter((m) => m.tipo === 'ingreso');
    const map = new Map<string, { total: number; count: number }>();
    for (const m of delPeriodo) {
      const key = m.categoria || 'otro';
      const cur = map.get(key) || { total: 0, count: 0 };
      cur.total += Number(m.monto) || 0;
      cur.count += 1;
      map.set(key, cur);
    }

    const rango = this.rangoPeriodo(modo, valor);
    if (rango && banios.length) {
      const baniosSinCaja = banios.filter((b) => {
        if (b.activo === false || b.estado === 'cancelado' || debeExcluirRefuerzoIngresoServicio(b)) {
          return false;
        }
        const f = String(b.fecha_banio || b.created_at || '').slice(0, 10);
        return f >= rango.desde && f <= rango.hasta;
      });
      if (baniosSinCaja.length) {
        const extra = baniosSinCaja.reduce((a, b) => a + (Number(b.precio_total) || 0), 0);
        const cur = map.get('banio') || { total: 0, count: 0 };
        cur.total += extra;
        cur.count += baniosSinCaja.length;
        map.set('banio', cur);
      }
    }

    if (rango && pensiones.length) {
      const pensionSinCaja = pensiones.filter((e) => {
        if (e.activo === false || e.estado === 'cancelada' || e.cajaMovimientoId || e.cobradaEnVisitaId) {
          return false;
        }
        if (e.estado !== 'activa' && e.estado !== 'finalizada') {
          return false;
        }
        const f = String(e.fecha_ingreso || '').slice(0, 10);
        return f >= rango.desde && f <= rango.hasta;
      });
      if (pensionSinCaja.length) {
        const extra = pensionSinCaja.reduce((a, e) => a + (Number(e.precio_total) || 0), 0);
        const cur = map.get('pension') || { total: 0, count: 0 };
        cur.total += extra;
        cur.count += pensionSinCaja.length;
        map.set('pension', cur);
      }
    }

    const orden = [...CAJA_CATEGORIAS_INGRESO, 'sin_categoria'] as const;
    const rows = Array.from(map.entries()).map(([categoria, v]) => ({
      categoria: categoria as CajaCategoria | 'sin_categoria',
      label:
        categoria === 'sin_categoria'
          ? 'Sin categoría'
          : CAJA_CATEGORIA_LABELS[categoria as CajaCategoria] || categoria,
      total: v.total,
      count: v.count,
    }));

    return rows.sort((a, b) => {
      const ia = orden.indexOf(a.categoria as (typeof orden)[number]);
      const ib = orden.indexOf(b.categoria as (typeof orden)[number]);
      const ra = ia >= 0 ? ia : orden.length;
      const rb = ib >= 0 ? ib : orden.length;
      if (ra !== rb) return ra - rb;
      return b.total - a.total;
    });
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
      const ingresos = delDia.filter((m) => m.tipo === 'ingreso').reduce((a, m) => a + (Number(m.monto) || 0), 0);
      const egresos = delDia.filter((m) => m.tipo === 'egreso').reduce((a, m) => a + (Number(m.monto) || 0), 0);
      return { fecha, ingresos, egresos, ganancia: ingresos - egresos };
    });
  }

  /** @deprecated Preferir calcularKpisPeriodo('dia', fecha). */
  calcularKpisDia(movimientos: CajaMovimiento[], fechaDia: string): CajaDiaKpis {
    return this.calcularKpisPeriodo(movimientos, 'dia', fechaDia);
  }

  getCortes(): Observable<CajaCorte[]> {
    return this.db
      .list<CajaCorte>(this.cortesPath)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key!, ...(c.payload.val() as CajaCorte) }))
            .filter((c) => c.activo !== false)
            .sort(
              (a, b) =>
                String(b.fecha || '').localeCompare(String(a.fecha || '')) ||
                String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
            )
        ),
        catchError((error) => {
          console.error('Error al obtener cortes de caja:', error);
          return throwError(() => error);
        })
      );
  }

  getTurno(fecha: string): Observable<CajaTurno | null> {
    const key = String(fecha || '').slice(0, 10);
    return this.db
      .object<CajaTurno>(`${this.turnosPath}/${key}`)
      .valueChanges()
      .pipe(map((v) => (v && v.abiertaEn ? { fecha: key, ...v } : null)));
  }

  async getTurnoOnce(fecha: string): Promise<CajaTurno | null> {
    return firstValueFrom(this.getTurno(fecha).pipe(take(1)));
  }

  async getCortesOnce(): Promise<CajaCorte[]> {
    return firstValueFrom(this.getCortes().pipe(take(1)));
  }

  /**
   * Spec 071 — apertura implícita en el primer cobro del día.
   * No pisa un turno ya abierto. Si el día ya tiene corte, no reabre.
   */
  async asegurarTurnoDelDia(fecha?: string): Promise<CajaTurno> {
    const key = String(fecha || this.hoyLocalIsoDate()).slice(0, 10);
    const existing = await this.getTurnoOnce(key);
    if (existing?.abiertaEn) return existing;

    const cortes = await this.getCortesOnce();
    if (yaHayCorteDelDia(cortes, key)) {
      const corte = cortes.find((c) => c.activo !== false && String(c.fecha || '').slice(0, 10) === key);
      return {
        fecha: key,
        abiertaEn: corte?.createdAt || new Date().toISOString(),
        fondoInicial: Number(corte?.fondoInicial) || 0,
        corteId: corte?.id,
      };
    }

    const createdBy = await this.currentStaff.getStaffId();
    const row: CajaTurno = {
      abiertaEn: new Date().toISOString(),
      fondoInicial: fondoInicialDesdeUltimoCorte(cortes),
      createdBy: createdBy || undefined,
    };
    await this.db.object(`${this.turnosPath}/${key}`).update(row);
    return { fecha: key, ...row };
  }

  async marcarCorteEnTurno(fecha: string, corteId: string): Promise<void> {
    const key = String(fecha || '').slice(0, 10);
    if (!key || !corteId) return;
    const existing = await this.getTurnoOnce(key);
    if (!existing) {
      await this.db.object(`${this.turnosPath}/${key}`).update({
        abiertaEn: new Date().toISOString(),
        fondoInicial: 0,
        corteId,
      });
      return;
    }
    await this.db.object(`${this.turnosPath}/${key}`).update({ corteId });
  }

  async guardarCorte(corte: Omit<CajaCorte, 'id' | 'createdAt' | 'createdBy' | 'activo'>): Promise<string> {
    const fecha = String(corte.fecha || this.hoyLocalIsoDate()).slice(0, 10);
    const cortes = await this.getCortesOnce();
    if (yaHayCorteDelDia(cortes, fecha)) {
      throw new Error('Ya hay un corte de este día. No se guarda un segundo corte.');
    }
    const now = new Date().toISOString();
    const createdBy = await this.currentStaff.getStaffId();
    const row: CajaCorte = {
      ...corte,
      fecha,
      activo: true,
      createdAt: now,
      createdBy,
    };
    const ref = await this.db.list(this.cortesPath).push(row);
    const id = ref.key;
    if (!id) {
      throw new Error('No se pudo guardar el corte');
    }
    await stampRtdbIdAfterPush(this.db, this.cortesPath, id);
    await this.marcarCorteEnTurno(fecha, id);
    return id;
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
