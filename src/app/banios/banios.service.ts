import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError, firstValueFrom } from 'rxjs';
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
        console.log('🚀 Iniciando creación de baño...');
        console.log('🔍 Datos recibidos:', banio);
        
        // Validar campos requeridos
        if (!banio.paciente_id || !banio.fecha_banio || !banio.hora_banio) {
          console.error('❌ Campos requeridos faltantes:', {
            paciente_id: banio.paciente_id,
            fecha_banio: banio.fecha_banio,
            hora_banio: banio.hora_banio
          });
          throw new Error('Faltan campos requeridos: paciente_id, fecha_banio, hora_banio');
        }
        
        console.log('✅ Campos requeridos validados');
        
        // Verificar duplicados
        console.log('🔍 Verificando duplicados...');
        const baniosExistentes = await firstValueFrom(this.getBanios());
        console.log('🔍 Baños existentes encontrados:', baniosExistentes?.length || 0);
        
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
        
        console.log('✅ Validaciones pasadas, creando baño...');
        
        // Limpiar campos undefined antes de enviar a Firebase
        const banioLimpio = { ...banio };
        Object.keys(banioLimpio).forEach(key => {
          if (banioLimpio[key] === undefined) {
            delete banioLimpio[key];
          }
        });
        
        const banioCompleto: Banio = {
          ...banioLimpio,
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          created_by: banio.created_by || 'system', // Valor por defecto si no se proporciona
          activo: true, // Asegurar que esté activo por defecto
          // Asegurar que los arrays estén definidos y no sean undefined
          productos_utilizados: banio.productos_utilizados || [],
          servicios_adicionales: banio.servicios_adicionales || [],
          alergias_conocidas: banio.alergias_conocidas || []
        };
        
        console.log('🔍 Baño completo a guardar:', banioCompleto);
        console.log('🔍 Ruta de Firebase:', this.basePath);

        // Usar then/catch en lugar de await para mejor manejo de errores
        this.db.list<Banio>(this.basePath).push(banioCompleto)
          .then((ref) => {
            console.log('✅ Baño creado exitosamente con ID:', ref.key);
            resolve(ref.key!);
          })
          .catch((error) => {
            console.error('❌ Error de Firebase al crear baño:', error);
            reject(error);
          });
          
      } catch (error) {
        console.error('❌ Error al crear baño:', error);
        console.error('❌ Stack trace:', error.stack);
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
    const cambios: Partial<Banio> = { estado: nuevoEstado };
    // Si se cancela, revertir el pago para que no cuente en ingresos
    if (nuevoEstado === 'cancelado') {
      cambios.pagado = false;
    }
    return this.actualizarBanio(id, cambios);
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
            .filter(b => b.estado === 'completado' && b.pagado)
            .reduce((sum, b) => sum + (b.precio_total || 0), 0)
        };
      })
    );
  }
}
