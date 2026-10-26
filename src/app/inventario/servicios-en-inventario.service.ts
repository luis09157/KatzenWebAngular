import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { CandidatoServicioInventario, detectarServiciosEnInventario } from './servicios-en-inventario.util';

/**
 * Pasa servicios guardados como producto al Catálogo de servicios (spec 100, 2026-10-26).
 * Una sola actualización (todo o nada). El producto NO se borra: queda `activo: false`
 * con `movidoA` y `movidoEn`. Rollback: volver `activo: true` a los que tengan ese `movidoEn`
 * y dar de baja los servicios con `origenProductoId`.
 */
@Injectable({ providedIn: 'root' })
export class ServiciosEnInventarioService {
  private readonly productosPath = 'Katzen/Inventario/Productos';
  private readonly serviciosPath = 'Katzen/ServiciosClinica';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService,
    private sucursal: SucursalContextService
  ) {}

  async detectar(): Promise<CandidatoServicioInventario[]> {
    const [prods, servs] = await Promise.all([
      this.db.database.ref(this.productosPath).once('value'),
      this.db.database.ref(this.serviciosPath).once('value'),
    ]);
    return detectarServiciosEnInventario(prods.val() || {}, servs.val() || {});
  }

  /** Mueve los elegidos. Devuelve cuántos servicios se crearon y cuántos productos se ocultaron. */
  async mover(elegidos: CandidatoServicioInventario[]): Promise<{ creados: number; ocultados: number; movidoEn: string }> {
    const staffId = (await this.currentStaff.getStaffId()) || 'system';
    const now = new Date().toISOString();
    const updates: Record<string, unknown> = {};
    let creados = 0;
    for (const c of elegidos) {
      if (c.destino === 'catalogo_nuevo') {
        const key = this.db.database.ref(this.serviciosPath).push().key;
        if (!key) throw new Error('No se pudo preparar el servicio');
        updates[`${this.serviciosPath}/${key}`] = this.sucursal.stamp({
          id: key,
          nombre: c.nombre,
          tipo: c.tipoServicio || 'procedimiento',
          esDomicilio: false,
          precio_venta: c.precioVenta,
          precio_costo: c.precioCosto,
          aplicaIva: c.aplicaIva,
          tasaIva: c.aplicaIva ? c.tasaIva : 0,
          notas: 'Pasado desde Inventario con el mismo precio.',
          origenProductoId: c.productoId,
          activo: true,
          created_at: now,
          updated_at: now,
          created_by: staffId,
        });
        creados++;
      }
      const base = `${this.productosPath}/${c.productoId}`;
      updates[`${base}/activo`] = false;
      updates[`${base}/movidoA`] = c.destino;
      updates[`${base}/movidoEn`] = now;
      updates[`${base}/updated_at`] = now;
    }
    if (!elegidos.length) return { creados: 0, ocultados: 0, movidoEn: now };
    await this.db.database.ref().update(updates);
    return { creados, ocultados: elegidos.length, movidoEn: now };
  }
}
