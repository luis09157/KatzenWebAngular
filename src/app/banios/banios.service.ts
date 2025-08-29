import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Banio, TipoServicio, ProductoPeluqueria } from '../shared/banio.model';

@Injectable({
  providedIn: 'root'
})
export class BaniosService {
  private readonly basePath = 'Katzen/Banios';
  private readonly tiposPath = 'Katzen/TiposServiciosPeluqueria';
  private readonly productosPath = 'Katzen/ProductosPeluqueria';

  constructor(private db: AngularFireDatabase) {}

  // ===== CRUD PARA BAÑOS =====
  
  getBanios(): Observable<Banio[]> {
    return this.db.list<Banio>(this.basePath)
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(c => ({ id: c.payload.key, ...c.payload.val() }))),
        catchError(error => {
          console.error('Error al obtener baños:', error);
          return throwError(() => error);
        })
      );
  }

  getBanioById(id: string): Observable<Banio | null> {
    return this.db.object<Banio>(`${this.basePath}/${id}`)
      .valueChanges()
      .pipe(
        map(banio => banio ? { id, ...banio } : null),
        catchError(error => {
          console.error('Error al obtener baño por ID:', error);
          return throwError(() => error);
        })
      );
  }

  crearBanio(banio: Omit<Banio, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        // Validar campos requeridos
        if (!banio.paciente_id || !banio.fecha_banio || !banio.hora_banio) {
          throw new Error('Faltan campos requeridos: paciente_id, fecha_banio, hora_banio');
        }
        
        // Verificar duplicados
        const baniosExistentes = await this.getBanios().toPromise();
        
        if (baniosExistentes && baniosExistentes.length > 0) {
          const duplicado = baniosExistentes.find(b => 
            b.paciente_id === banio.paciente_id &&
            b.fecha_banio === banio.fecha_banio &&
            b.hora_banio === banio.hora_banio &&
            b.activo !== false
          );
          
          if (duplicado) {
            throw new Error(`Ya existe un baño programado para este paciente en la misma fecha y hora`);
          }
          
          // Verificar conflictos de horario del peluquero
          if (banio.peluquero_id) {
            const conflictoPeluquero = baniosExistentes.find(b => 
              b.peluquero_id === banio.peluquero_id &&
              b.fecha_banio === banio.fecha_banio &&
              b.hora_banio === banio.hora_banio &&
              b.activo !== false
            );
            
            if (conflictoPeluquero) {
              throw new Error(`El peluquero ya tiene un baño programado para esta fecha y hora`);
            }
          }
        }
        
        const banioCompleto: Banio = {
          ...banio,
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
        };

        const ref = await this.db.list<Banio>(this.basePath).push(banioCompleto);
        console.log('Baño creado exitosamente con ID:', ref.key);
        resolve(ref.key!);
      } catch (error) {
        console.error('Error al crear baño:', error);
        reject(error);
      }
    });
  }

  actualizarBanio(id: string, banio: Partial<Banio>): Promise<void> {
    const datosActualizados = {
      ...banio,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    return this.db.object<Banio>(`${this.basePath}/${id}`)
      .update(datosActualizados)
      .then(() => {
        console.log('Baño actualizado exitosamente');
      })
      .catch(error => {
        console.error('Error al actualizar baño:', error);
        throw error;
      });
  }

  eliminarBanio(id: string): Promise<void> {
    return this.db.object<Banio>(`${this.basePath}/${id}`)
      .remove()
      .then(() => {
        console.log('Baño eliminado exitosamente');
      })
      .catch(error => {
        console.error('Error al eliminar baño:', error);
        throw error;
      });
  }

  bajaLogicaBanio(id: string): Promise<void> {
    return this.actualizarBanio(id, { activo: false });
  }

  // ===== MÉTODOS ESPECÍFICOS PARA BAÑOS =====

  getBaniosPorFecha(fecha: string): Observable<Banio[]> {
    return this.getBanios().pipe(
      map(banios => banios.filter(b => b.fecha_banio === fecha && b.activo !== false))
    );
  }

  getBaniosPorEstado(estado: Banio['estado']): Observable<Banio[]> {
    return this.getBanios().pipe(
      map(banios => banios.filter(b => b.estado === estado && b.activo !== false))
    );
  }

  getBaniosPorPeluquero(peluqueroId: string): Observable<Banio[]> {
    return this.getBanios().pipe(
      map(banios => banios.filter(b => b.peluquero_id === peluqueroId && b.activo !== false))
    );
  }

  cambiarEstadoBanio(id: string, nuevoEstado: Banio['estado']): Promise<void> {
    return this.actualizarBanio(id, { estado: nuevoEstado });
  }

  marcarComoPagado(id: string): Promise<void> {
    return this.actualizarBanio(id, { pagado: true });
  }

  // ===== CRUD PARA TIPOS DE SERVICIOS =====

  getTiposServicios(): Observable<TipoServicio[]> {
    return this.db.list<TipoServicio>(this.tiposPath)
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(c => ({ id: c.payload.key, ...c.payload.val() }))),
        catchError(error => {
          console.error('Error al obtener tipos de servicios:', error);
          return throwError(() => error);
        })
      );
  }

  crearTipoServicio(tipo: Omit<TipoServicio, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const tipoCompleto: TipoServicio = {
      ...tipo,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    return this.db.list<TipoServicio>(this.tiposPath)
      .push(tipoCompleto)
      .then(ref => ref.key!);
  }

  actualizarTipoServicio(id: string, tipo: Partial<TipoServicio>): Promise<void> {
    const datosActualizados = {
      ...tipo,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    return this.db.object<TipoServicio>(`${this.tiposPath}/${id}`)
      .update(datosActualizados);
  }

  eliminarTipoServicio(id: string): Promise<void> {
    return this.db.object<TipoServicio>(`${this.tiposPath}/${id}`)
      .remove();
  }

  // ===== CRUD PARA PRODUCTOS =====

  getProductos(): Observable<ProductoPeluqueria[]> {
    return this.db.list<ProductoPeluqueria>(this.productosPath)
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(c => ({ id: c.payload.key, ...c.payload.val() }))),
        catchError(error => {
          console.error('Error al obtener productos:', error);
          return throwError(() => error);
        })
      );
  }

  crearProducto(producto: Omit<ProductoPeluqueria, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const productoCompleto: ProductoPeluqueria = {
      ...producto,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    return this.db.list<ProductoPeluqueria>(this.productosPath)
      .push(productoCompleto)
      .then(ref => ref.key!);
  }

  actualizarProducto(id: string, producto: Partial<ProductoPeluqueria>): Promise<void> {
    const datosActualizados = {
      ...producto,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    return this.db.object<ProductoPeluqueria>(`${this.productosPath}/${id}`)
      .update(datosActualizados);
  }

  eliminarProducto(id: string): Promise<void> {
    return this.db.object<ProductoPeluqueria>(`${this.productosPath}/${id}`)
      .remove();
  }

  // ===== MÉTODOS DE BÚSQUEDA =====

  buscarBanios(texto: string): Observable<Banio[]> {
    return this.getBanios().pipe(
      map(banios => banios.filter(b => 
        b.activo !== false && (
          (b.paciente && b.paciente.toLowerCase().includes(texto.toLowerCase())) ||
          (b.cliente && b.cliente.toLowerCase().includes(texto.toLowerCase())) ||
          (b.tipo_servicio && b.tipo_servicio.toLowerCase().includes(texto.toLowerCase())) ||
          (b.observaciones && b.observaciones.toLowerCase().includes(texto.toLowerCase()))
        )
      ))
    );
  }

  // ===== MÉTODOS PARA ESTADÍSTICAS =====

  getEstadisticasBanios(): Observable<{
    total: number;
    programados: number;
    en_proceso: number;
    completados: number;
    cancelados: number;
    ingresos_totales: number;
  }> {
    return this.getBanios().pipe(
      map(banios => {
        const baniosActivos = banios.filter(b => b.activo !== false);
        return {
          total: baniosActivos.length,
          programados: baniosActivos.filter(b => b.estado === 'programado').length,
          en_proceso: baniosActivos.filter(b => b.estado === 'en_proceso').length,
          completados: baniosActivos.filter(b => b.estado === 'completado').length,
          cancelados: baniosActivos.filter(b => b.estado === 'cancelado').length,
          ingresos_totales: baniosActivos
            .filter(b => b.pagado)
            .reduce((sum, b) => sum + (b.precio_total || 0), 0)
        };
      })
    );
  }
}
