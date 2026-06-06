import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { Banio } from '../shared/banio.model';

export interface BanioPaciente extends Omit<Banio, 'created_at' | 'updated_at'> {
  id?: string;
  paciente_id: string;
  paciente_nombre?: string;
  cliente_nombre?: string;
  fecha_formateada?: string;
  tiempo_transcurrido?: string;
  estado_tiempo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BaniosPacienteService {
  private readonly basePath = 'Katzen/Banios';

  constructor(private db: AngularFireDatabase) {}

  // ===== CRUD PARA BAÑOS DE PACIENTE =====
  
  getBaniosPorPaciente(pacienteId: string): Observable<BanioPaciente[]> {
    return this.db.list<Banio>(this.basePath, ref =>
      ref.orderByChild('paciente_id').equalTo(pacienteId)
    ).snapshotChanges().pipe(
      take(1),
      map(changes => changes.map(c => ({ id: c.payload.key, ...c.payload.val() }))),
      map(banios => banios.filter(b => b.activo !== false)),
      map(banios => banios.map(banio => this.formatearBanioPaciente(banio))),
      catchError(error => {
        console.error('Error al obtener baños del paciente:', error);
        return throwError(() => error);
      })
    );
  }

  getBanioById(id: string): Observable<BanioPaciente | null> {
    return this.db.object<Banio>(`${this.basePath}/${id}`)
      .valueChanges()
      .pipe(
        map(banio => banio ? { id, ...banio } : null),
        map(banio => banio ? this.formatearBanioPaciente(banio) : null),
        catchError(error => {
          console.error('Error al obtener baño por ID:', error);
          return throwError(() => error);
        })
      );
  }

  crearBanioPaciente(banio: Omit<BanioPaciente, 'id' | 'created_at' | 'updated_at' | 'fecha_formateada' | 'tiempo_transcurrido' | 'estado_tiempo'>): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('🚀 Iniciando creación de baño para paciente...');
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
        const baniosExistentes = await firstValueFrom(this.getBaniosPorPaciente(banio.paciente_id));
        console.log('🔍 Baños existentes para este paciente:', baniosExistentes?.length || 0);
        
        if (baniosExistentes && baniosExistentes.length > 0) {
          const duplicado = baniosExistentes.find(b => 
            b.fecha_banio === banio.fecha_banio &&
            b.hora_banio === banio.hora_banio
          );
          
          if (duplicado) {
            throw new Error(`Ya existe un baño programado para este paciente en la misma fecha y hora`);
          }
          
          // Verificar conflictos de horario del peluquero
          if (banio.peluquero_id) {
            const conflictoPeluquero = baniosExistentes.find(b => 
              b.peluquero_id === banio.peluquero_id &&
              b.fecha_banio === banio.fecha_banio &&
              b.hora_banio === banio.hora_banio
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
          created_by: banio.created_by || 'system',
          activo: true,
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

  actualizarBanioPaciente(id: string, banio: Partial<BanioPaciente>): Promise<void> {
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

  eliminarBanioPaciente(id: string): Promise<void> {
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

  bajaLogicaBanioPaciente(id: string): Promise<void> {
    return this.actualizarBanioPaciente(id, { activo: false });
  }

  // ===== MÉTODOS ESPECÍFICOS PARA BAÑOS DE PACIENTE =====

  cambiarEstadoBanioPaciente(id: string, nuevoEstado: Banio['estado']): Promise<void> {
    const cambios: Partial<Banio> = { estado: nuevoEstado };
    // Si se cancela, revertir el pago para que no cuente en ingresos
    if (nuevoEstado === 'cancelado') {
      cambios.pagado = false;
    }
    return this.actualizarBanioPaciente(id, cambios);
  }

  marcarComoPagado(id: string): Promise<void> {
    return this.actualizarBanioPaciente(id, { pagado: true });
  }

  // ===== MÉTODOS DE BÚSQUEDA =====

  buscarBaniosPaciente(pacienteId: string, texto: string): Observable<BanioPaciente[]> {
    return this.getBaniosPorPaciente(pacienteId).pipe(
      map(banios => banios.filter(b => 
        (b.tipo_servicio && b.tipo_servicio.toLowerCase().includes(texto.toLowerCase())) ||
        (b.observaciones && b.observaciones.toLowerCase().includes(texto.toLowerCase())) ||
        (b.peluquero && b.peluquero.toLowerCase().includes(texto.toLowerCase()))
      ))
    );
  }

  // ===== MÉTODOS DE FORMATO =====

  private formatearBanioPaciente(banio: any): BanioPaciente {
    // Determinar qué fecha usar (prioridad: fecha_banio > created_at > updated_at)
    let fechaParaUsar = banio.fecha_banio || banio.created_at || banio.updated_at;
    
    // Validar y formatear fecha
    let fechaFormateada = 'Fecha no disponible';
    let tiempoTranscurrido = 'Sin información';
    
    if (fechaParaUsar) {
      try {
        // Intentar parsear la fecha
        const fecha = new Date(fechaParaUsar);
        
        // Verificar si la fecha es válida
        if (!isNaN(fecha.getTime())) {
          fechaFormateada = this.formatearFecha(fechaParaUsar);
          
          // Calcular tiempo transcurrido solo si la fecha es válida
          const ahora = new Date();
          const diffTime = Math.abs(ahora.getTime() - fecha.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 0) {
            tiempoTranscurrido = 'Hoy';
          } else if (diffDays === 1) {
            tiempoTranscurrido = 'Ayer';
          } else if (diffDays < 7) {
            tiempoTranscurrido = `Hace ${diffDays} días`;
          } else if (diffDays < 30) {
            const semanas = Math.floor(diffDays / 7);
            tiempoTranscurrido = `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
          } else if (diffDays < 365) {
            const meses = Math.floor(diffDays / 30);
            tiempoTranscurrido = `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
          } else {
            const años = Math.floor(diffDays / 365);
            tiempoTranscurrido = `Hace ${años} año${años > 1 ? 's' : ''}`;
          }
        } else {
          console.warn('Fecha inválida:', fechaParaUsar);
          tiempoTranscurrido = 'Fecha inválida';
        }
      } catch (error) {
        console.warn('Error al procesar fecha:', fechaParaUsar, error);
        tiempoTranscurrido = 'Error en fecha';
      }
    }

    return {
      ...banio,
      id: banio.id, // Asegurar que el id esté incluido
      fecha_formateada: fechaFormateada,
      tiempo_transcurrido: tiempoTranscurrido,
      estado_tiempo: this.getEstadoTiempo(banio.estado, fechaParaUsar, banio.hora_banio)
    };
  }

  private formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      // Intentar diferentes formatos de fecha
      let date: Date;
      
      // Si la fecha viene en formato YYYY-MM-DD
      if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(fecha + 'T00:00:00');
      }
      // Si la fecha viene en formato YYYY-MM-DD HH:mm:ss
      else if (fecha.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        date = new Date(fecha.replace(' ', 'T'));
      }
      // Si la fecha viene en formato ISO
      else if (fecha.includes('T')) {
        date = new Date(fecha);
      }
      // Formato por defecto
      else {
        date = new Date(fecha);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida para formatear:', fecha);
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', fecha, error);
      return 'Error en fecha';
    }
  }

  private getEstadoTiempo(estado: string, fecha: string, hora: string): string {
    if (!fecha) return 'Sin información';
    
    try {
      // Si no hay hora, usar solo la fecha para el cálculo
      let fechaHora: Date;
      
      if (hora) {
        // Si la fecha viene en formato YYYY-MM-DD
        if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
          fechaHora = new Date(`${fecha}T${hora}`);
        }
        // Si la fecha ya incluye tiempo (como created_at o updated_at)
        else if (fecha.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          // Extraer solo la fecha y combinar con la hora
          const fechaParte = fecha.split(' ')[0];
          fechaHora = new Date(`${fechaParte}T${hora}`);
        }
        // Si la fecha viene en formato ISO
        else if (fecha.includes('T')) {
          // Extraer solo la fecha y combinar con la hora
          const fechaParte = fecha.split('T')[0];
          fechaHora = new Date(`${fechaParte}T${hora}`);
        }
        // Formato por defecto
        else {
          fechaHora = new Date(`${fecha}T${hora}`);
        }
      } else {
        // Si no hay hora, usar solo la fecha
        if (fecha.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          fechaHora = new Date(fecha.replace(' ', 'T'));
        } else if (fecha.includes('T')) {
          fechaHora = new Date(fecha);
        } else {
          fechaHora = new Date(fecha);
        }
      }
      
      // Verificar si la fecha es válida
      if (isNaN(fechaHora.getTime())) {
        console.warn('Fecha/hora inválida para estado:', fecha, hora);
        return 'Fecha inválida';
      }
      
      const ahora = new Date();
      
      if (estado === 'completado') {
        return 'Completado';
      } else if (estado === 'cancelado') {
        return 'Cancelado';
      } else if (fechaHora < ahora) {
        return 'Vencido';
      } else {
        const diffTime = fechaHora.getTime() - ahora.getTime();
        const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
        
        if (diffHours <= 24) {
          return 'Próximo';
        } else {
          return 'Programado';
        }
      }
    } catch (error) {
      console.warn('Error al calcular estado de tiempo:', error);
      return 'Error en cálculo';
    }
  }

  // ===== MÉTODOS PARA ESTADÍSTICAS =====

  getEstadisticasBaniosPaciente(pacienteId: string): Observable<{
    total: number;
    programados: number;
    en_proceso: number;
    completados: number;
    cancelados: number;
    ingresos_totales: number;
  }> {
    console.log('📊 Calculando estadísticas para paciente:', pacienteId);
    
    return this.getBaniosPorPaciente(pacienteId).pipe(
      map(banios => {
        console.log('📊 Baños encontrados para estadísticas:', banios.length, banios);
        
        const stats = {
          total: banios.length,
          programados: banios.filter(b => b.estado === 'programado').length,
          en_proceso: banios.filter(b => b.estado === 'en_proceso').length,
          completados: banios.filter(b => b.estado === 'completado').length,
          cancelados: banios.filter(b => b.estado === 'cancelado').length,
          ingresos_totales: banios
            .filter(b => b.estado === 'completado' && b.pagado)
            .reduce((sum, b) => sum + (b.precio_total || 0), 0)
        };
        
        console.log('📊 Estadísticas calculadas:', stats);
        return stats;
      })
    );
  }
}
