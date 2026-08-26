import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError } from 'rxjs';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { CurrentStaffService } from '../core/services/current-staff.service';
import {
  PlantillaCosto,
  PlantillaCostoFormData,
  calcularCostoTotalItems
} from './plantilla-costo.models';

@Injectable({ providedIn: 'root' })
export class PlantillaCostoService {
  private readonly path = 'Katzen/Finanzas/PlantillasCosto';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {}

  getPlantillas(): Observable<PlantillaCosto[]> {
    return this.db
      .list<PlantillaCosto>(this.path)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key!, ...(c.payload.val() as PlantillaCosto) }))
            .filter((p) => p.activo !== false)
            .sort((a, b) => String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'))
        ),
        catchError((error) => {
          console.error('Error al obtener plantillas de costo:', error);
          return throwError(() => error);
        })
      );
  }

  async crearPlantilla(data: PlantillaCostoFormData): Promise<string> {
    const now = new Date().toISOString();
    const createdBy = await this.currentStaff.getStaffId();
    const items = this.sanitizeItems(data.items);
    const plantilla: PlantillaCosto = {
      nombre: String(data.nombre || '').trim(),
      tipoServicio: data.tipoServicio,
      items,
      costoTotalEstimado: calcularCostoTotalItems(items),
      activo: true,
      createdAt: now,
      updatedAt: now,
      createdBy
    };
    if (data.precioSugeridoCliente != null && !Number.isNaN(Number(data.precioSugeridoCliente))) {
      plantilla.precioSugeridoCliente = Number(data.precioSugeridoCliente);
    }

    const ref = await this.db.list<PlantillaCosto>(this.path).push(plantilla);
    await stampRtdbIdAfterPush(this.db, this.path, ref.key);
    return ref.key!;
  }

  async actualizarPlantilla(id: string, data: PlantillaCostoFormData): Promise<void> {
    const items = this.sanitizeItems(data.items);
    const clean: Record<string, unknown> = {
      nombre: String(data.nombre || '').trim(),
      tipoServicio: data.tipoServicio,
      items,
      costoTotalEstimado: calcularCostoTotalItems(items),
      updatedAt: new Date().toISOString()
    };
    if (data.precioSugeridoCliente != null && !Number.isNaN(Number(data.precioSugeridoCliente))) {
      clean['precioSugeridoCliente'] = Number(data.precioSugeridoCliente);
    }
    await this.db.object(`${this.path}/${id}`).update(clean);
  }

  async bajaLogicaPlantilla(id: string): Promise<void> {
    await this.db.object(`${this.path}/${id}`).update({
      activo: false,
      updatedAt: new Date().toISOString()
    });
  }

  private sanitizeItems(items: PlantillaCostoFormData['items']): PlantillaCosto['items'] {
    return (items || [])
      .filter((it) => String(it.nombre || '').trim().length > 0)
      .map((it) => {
        const row: PlantillaCosto['items'][0] = {
          tipo: it.tipo === 'producto_inventario' ? 'producto_inventario' : 'gasto_libre',
          nombre: String(it.nombre).trim(),
          cantidad: Math.max(0.01, Number(it.cantidad) || 1),
          costoUnitario: Math.max(0, Number(it.costoUnitario) || 0)
        };
        if (row.tipo === 'producto_inventario' && it.productoId) {
          row.productoId = it.productoId;
        }
        return row;
      });
  }
}
