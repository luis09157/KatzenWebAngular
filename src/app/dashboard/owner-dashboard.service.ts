import { Injectable } from '@angular/core';
import { Observable, combineLatest, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CajaService } from '../finanzas/caja.service';
import { CajaMovimiento } from '../finanzas/caja.models';
import { BaniosService } from '../banios/banios.service';
import { Banio } from '../shared/banio.model';
import { CitasService } from '../citas/citas.service';
import { ClientesService } from '../clientes/clientes.service';
import { InventarioService } from '../inventario/inventario.service';
import { PensionService } from '../pension/pension.service';
import {
  PeriodoPreset,
  fechaEnRango,
  normalizeFechaIso,
  resolverPeriodo,
  serieDiariaEnRango
} from '../core/utils/periodo-filtro.util';
import {
  OwnerDashboardSnapshot,
  OwnerKpisFinancieros,
  OwnerKpisOperativos,
  OwnerTopItem
} from './owner-dashboard.models';
import { CAJA_CATEGORIA_LABELS } from '../finanzas/caja.models';

@Injectable({ providedIn: 'root' })
export class OwnerDashboardService {
  constructor(
    private caja: CajaService,
    private banios: BaniosService,
    private citas: CitasService,
    private clientes: ClientesService,
    private inventario: InventarioService,
    private pension: PensionService
  ) {}

  snapshot$(
    preset: PeriodoPreset,
    desdeCustom?: string,
    hastaCustom?: string
  ): Observable<OwnerDashboardSnapshot> {
    const rango = resolverPeriodo(preset, desdeCustom, hastaCustom);
    return combineLatest([
      this.caja.getMovimientos().pipe(catchError(() => of([] as CajaMovimiento[]))),
      this.banios.getBanios().pipe(catchError(() => of([] as Banio[]))),
      this.citas.getCitas().pipe(catchError(() => of([] as any[]))),
      this.clientes.getClientes().pipe(catchError(() => of([] as any[]))),
      this.inventario.getProductos().pipe(catchError(() => of([] as any[]))),
      this.pension.getEstancias().pipe(catchError(() => of([] as any[])))
    ]).pipe(
      map(([movimientos, banios, citas, clientes, productos, estancias]) => {
        const movPeriodo = (movimientos || []).filter(
          (m) => m.activo !== false && fechaEnRango(m.fecha, rango)
        );
        const ingresos = movPeriodo.filter((m) => m.tipo === 'ingreso');
        const egresos = movPeriodo.filter((m) => m.tipo === 'egreso');

        const ventaBruta = sumMonto(ingresos);
        const costosAsociados = ingresos.reduce((acc, m) => {
          if (m.costoAsociado == null || Number.isNaN(Number(m.costoAsociado))) return acc;
          return acc + Number(m.costoAsociado);
        }, 0);
        const gastosOperativos = sumMonto(egresos);
        const gananciaNeta = ventaBruta - costosAsociados - gastosOperativos;

        const financieros: OwnerKpisFinancieros = {
          ventaBruta,
          costosAsociados,
          gastosOperativos,
          gananciaNeta,
          transaccionesPeriodo: movPeriodo.length
        };

        const hoy = normalizeFechaIso(new Date().toISOString())!;
        const baniosActivos = (banios || []).filter((b) => b.activo !== false);
        const baniosPeriodo = baniosActivos.filter((b) =>
          fechaEnRango(b.fecha_banio || b.created_at, rango)
        );
        const citasActivas = (citas || []).filter((c: any) => c.activo !== false);
        const citasHoy = citasActivas.filter((c: any) => {
          const f = normalizeFechaIso(c.fecha || c.fecha_hora);
          return f === hoy;
        }).length;
        const citasPeriodo = citasActivas.filter((c: any) =>
          fechaEnRango(c.fecha || c.fecha_hora, rango)
        ).length;

        const clientesActivos = (clientes || []).filter((c: any) => c.activo !== false);
        const clientesNuevosPeriodo = clientesActivos.filter((c: any) =>
          fechaEnRango(c.fecha_registro || c.created_at || c.fecha_creacion, rango)
        ).length;

        const productosActivos = (productos || []).filter((p: any) => p.activo !== false);
        const stockBajo = productosActivos.filter((p: any) => {
          const stock = Number(p.stock_actual) || 0;
          const min = Number(p.stock_minimo) || 0;
          return min > 0 && stock <= min;
        }).length;

        const estanciasActivas = (estancias || []).filter(
          (e: any) => e.activo !== false && (e.estado === 'activa' || e.estado === 'reservada')
        );

        const operativos: OwnerKpisOperativos = {
          citasHoy,
          citasPeriodo,
          baniosPeriodo: baniosPeriodo.length,
          stockBajo,
          clientesNuevosPeriodo,
          pensionActivas: estanciasActivas.filter((e: any) => e.estado === 'activa').length
        };

        const porDia = new Map<string, number>();
        for (const m of ingresos) {
          const f = normalizeFechaIso(m.fecha);
          if (!f) continue;
          porDia.set(f, (porDia.get(f) || 0) + (Number(m.monto) || 0));
        }
        const serieIngresos = serieDiariaEnRango(
          rango,
          Array.from(porDia.entries()).map(([fecha, valor]) => ({ fecha, valor }))
        ).map((p) => ({ fecha: p.fecha, ingresos: p.valor }));

        const topServicios = this.topPorCategoria(ingresos);
        const topProductos = this.topProductosVenta(ingresos);
        // Refuerzo baños sin caja: agregar valor estimado del período
        if (!topServicios.some((t) => /baño|pelu/i.test(t.nombre))) {
          const valorBanios = baniosPeriodo
            .filter((b) => b.estado !== 'cancelado')
            .reduce((a, b) => a + (Number(b.precio_total) || 0), 0);
          if (valorBanios > 0) {
            topServicios.push({
              rank: topServicios.length + 1,
              nombre: 'Baños / peluquería (estimado)',
              detalle: `${baniosPeriodo.length} servicio(s) del período`,
              monto: valorBanios
            });
            topServicios.sort((a, b) => b.monto - a.monto);
            topServicios.forEach((t, i) => (t.rank = i + 1));
          }
        }

        const resumen: OwnerDashboardSnapshot['resumen'] = [
          { label: 'Ingresos (venta bruta)', value: ventaBruta, tone: 'ok' },
          { label: 'Costos de servicio', value: costosAsociados, tone: 'cost' },
          { label: 'Gastos operativos', value: gastosOperativos, tone: 'gasto' },
          { label: 'Ganancia neta', value: gananciaNeta, tone: 'neto' }
        ];

        return {
          rango,
          preset,
          financieros,
          operativos,
          serieIngresos,
          topServicios: topServicios.slice(0, 5),
          topProductos: topProductos.slice(0, 5),
          resumen
        };
      })
    );
  }

  private topPorCategoria(ingresos: CajaMovimiento[]): OwnerTopItem[] {
    const map = new Map<string, { monto: number; count: number }>();
    for (const m of ingresos) {
      const key = m.categoria || 'otro';
      const cur = map.get(key) || { monto: 0, count: 0 };
      cur.monto += Number(m.monto) || 0;
      cur.count += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries())
      .map(([cat, v]) => ({
        rank: 0,
        nombre: CAJA_CATEGORIA_LABELS[cat as keyof typeof CAJA_CATEGORIA_LABELS] || cat,
        detalle: `${v.count} cobro(s)`,
        monto: v.monto
      }))
      .sort((a, b) => b.monto - a.monto)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }

  private topProductosVenta(ingresos: CajaMovimiento[]): OwnerTopItem[] {
    const ventas = ingresos.filter((m) => m.categoria === 'venta_producto');
    if (!ventas.length) return [];
    // Agrupar por concepto (sin catálogo de líneas de producto en caja)
    const map = new Map<string, { monto: number; count: number }>();
    for (const m of ventas) {
      const nombre = (m.concepto || 'Venta de producto').trim() || 'Venta de producto';
      const cur = map.get(nombre) || { monto: 0, count: 0 };
      cur.monto += Number(m.monto) || 0;
      cur.count += 1;
      map.set(nombre, cur);
    }
    return Array.from(map.entries())
      .map(([nombre, v]) => ({
        rank: 0,
        nombre,
        detalle: `${v.count} venta(s)`,
        monto: v.monto
      }))
      .sort((a, b) => b.monto - a.monto)
      .map((t, i) => ({ ...t, rank: i + 1 }));
  }
}

function sumMonto(list: CajaMovimiento[]): number {
  return list.reduce((a, m) => a + (Number(m.monto) || 0), 0);
}
