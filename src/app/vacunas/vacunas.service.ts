import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import {
  AsegurarRefuerzoResultado,
  RecordatoriosService
} from '../recordatorios/recordatorios.service';
import {
  VacunaRefuerzoInput,
  calcularProximaDesdeIntervalo,
  formatRtdbLocal,
  resolverFechaRecordatorioRefuerzo
} from './vacuna-recordatorio.util';
import { esPacienteFallecido } from './esquema-vacuna.util';

export interface GuardarVacunaResultado {
  vacuna: any;
  refuerzo?: AsegurarRefuerzoResultado;
}

@Injectable({
  providedIn: 'root'
})
export class VacunasService {
  constructor(
    private db: AngularFireDatabase,
    private recordatoriosService: RecordatoriosService
  ) {}

  // Obtener todas las vacunas con sus IDs
  getVacunas(): Observable<any[]> {
    return this.db.list('Katzen/Vacunas').snapshotChanges().pipe(
      map(changes => 
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(v => v.activo !== false && v.activo !== 0) // Solo mostrar vacunas activas
          .sort((a, b) => {
            const fechaA = new Date(a.fechaRegistro || a.fecha_aplicacion || a.created_at || 0);
            const fechaB = new Date(b.fechaRegistro || b.fecha_aplicacion || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
          })
      )
    );
  }

  // Obtener vacunas por paciente_id
  getVacunasPorPaciente(pacienteId: string): Observable<any[]> {
    return this.db.list('Katzen/Vacunas', ref =>
      ref.orderByChild('idPaciente').equalTo(pacienteId)
    ).snapshotChanges().pipe(
      take(1),
      map(changes =>
        changes
          .map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
          .filter(v =>
            (v.idPaciente === pacienteId || v.paciente_id === pacienteId) &&
            v.activo !== false &&
            v.activo !== 0
          )
          .sort((a, b) => {
            const fechaA = new Date(a.fechaRegistro || a.fecha_aplicacion || a.created_at || 0);
            const fechaB = new Date(b.fechaRegistro || b.fecha_aplicacion || b.created_at || 0);
            return fechaB.getTime() - fechaA.getTime();
          })
      )
    );
  }

  // Obtener una vacuna por id
  getVacuna(id: string): Observable<any> {
    return this.db.object(`Katzen/Vacunas/${id}`).valueChanges().pipe(
      map(vacuna => vacuna ? { id, ...(vacuna as any) } : null)
    );
  }

  // Crear nueva vacuna
  async crearVacuna(vacuna: any): Promise<any> {
    try {
      const timestamp = Date.now();
      console.log(`VacunasService [${timestamp}] - Iniciando creación de vacuna:`, vacuna);
      const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const pacienteEstado = vacuna?.pacienteEstado;
      
      // Validación básica de campos requeridos
      if (!vacuna.idPaciente || !vacuna.vacuna) {
        throw new Error('Faltan campos requeridos: idPaciente y vacuna');
      }
      
      // Validar duplicados
      console.log(`VacunasService [${timestamp}] - Verificando duplicados...`);
      const vacunasExistentes = await firstValueFrom(this.getVacunasPorPaciente(vacuna.idPaciente));
      console.log(`VacunasService [${timestamp}] - Duplicados verificados, encontradas:`, vacunasExistentes?.length || 0);
      
      if (vacunasExistentes && vacunasExistentes.length > 0) {
        const duplicada = vacunasExistentes.find(v => 
          v.vacuna === vacuna.vacuna &&
          v.fechaAplicacion === vacuna.fechaAplicacion &&
          v.activo !== false
        );
        
        if (duplicada) {
          throw new Error(`Ya existe un registro de la vacuna "${vacuna.vacuna}" para esta fecha en este paciente`);
        }
      }
      
      console.log(`VacunasService [${timestamp}] - Preparando datos de nueva vacuna...`);
      const enriquecida = this.enriquecerProximasFechas(vacuna);
      const nuevaVacuna = {
        ...enriquecida,
        fechaRegistro: timestampStr,
        recordatorio:
          enriquecida.agendarRefuerzo !== false &&
          (enriquecida.recordatorio === true ||
            !!resolverFechaRecordatorioRefuerzo(enriquecida)),
        stability: enriquecida.stability || 0,
        activo: true,
        aplicada: enriquecida.aplicada || false
      };

      console.log(`VacunasService [${timestamp}] - Datos de nueva vacuna preparados:`, nuevaVacuna);

      // Usar push() para generar ID automático de Firebase
      console.log(`VacunasService [${timestamp}] - Ejecutando push() a Firebase...`);
      console.log(`VacunasService [${timestamp}] - Ruta Firebase: Katzen/Vacunas`);
      
      const ref = await this.db.list('Katzen/Vacunas').push(nuevaVacuna);
      await stampRtdbIdAfterPush(this.db, 'Katzen/Vacunas', ref.key);
      
      console.log(`VacunasService [${timestamp}] - Push() completado, ID generado:`, ref.key);
      console.log(`VacunasService [${timestamp}] - Vacuna creada exitosamente con ID:`, ref.key);
      
      const resultado = { key: ref.key, id: ref.key, ...nuevaVacuna };
      const refuerzo = await this.sincronizarRecordatorioRefuerzo({
        ...resultado,
        pacienteEstado
      });
      console.log(`VacunasService [${timestamp}] - Retornando resultado:`, resultado);
      return { ...resultado, _refuerzo: refuerzo } as any;
    } catch (error) {
      console.error('Error al crear vacuna:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No se pudo registrar la vacuna en la base de datos');
    }
  }

  // Actualizar vacuna existente
  async actualizarVacuna(id: string, cambios: any): Promise<GuardarVacunaResultado> {
    const pacienteEstado = cambios?.pacienteEstado;
    const enriquecida = this.enriquecerProximasFechas(cambios);
    if (
      enriquecida.agendarRefuerzo !== false &&
      resolverFechaRecordatorioRefuerzo(enriquecida)
    ) {
      enriquecida.recordatorio = true;
    }
    if (enriquecida.agendarRefuerzo === false) {
      enriquecida.recordatorio = false;
    }
    await this.db.object(`Katzen/Vacunas/${id}`).update(enriquecida);
    const refuerzo = await this.sincronizarRecordatorioRefuerzo({
      ...enriquecida,
      id,
      pacienteEstado
    });
    return { vacuna: { id, ...enriquecida }, refuerzo };
  }

  // Eliminar vacuna — Spec 019: nunca .remove(); siempre baja lógica
  eliminarVacuna(id: string): Promise<void> {
    return this.bajaLogicaVacuna(id);
  }

  // Baja lógica: marcar como inactiva
  async bajaLogicaVacuna(id: string): Promise<void> {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      await this.db.object(`Katzen/Vacunas/${id}`).update({ 
        activo: false,
        fechaEliminacion: timestamp
      });

      try {
        await this.recordatoriosService.cancelarPendientesPorVacuna(id);
      } catch (e) {
        console.warn('VacunasService - no se pudieron cancelar recordatorios de refuerzo:', e);
      }
    } catch (error) {
      console.error('Error en baja lógica de vacuna:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('No se pudo realizar la baja lógica de la vacuna');
    }
  }

  /**
   * Spec 033 + 052: sincroniza recordatorio solo si el vet confirmó agendar.
   * Sin confirmación / Fallecido / «No agendar» → no crea recordatorio.
   */
  async sincronizarRecordatorioRefuerzo(
    vacuna: VacunaRefuerzoInput & {
      id?: string;
      key?: string;
      agendarRefuerzo?: boolean;
      esquemaConfirmado?: boolean;
      pacienteEstado?: string;
    }
  ): Promise<AsegurarRefuerzoResultado | undefined> {
    try {
      const id = vacuna.id || vacuna.key;
      if (esPacienteFallecido(vacuna.pacienteEstado)) {
        if (id) {
          try {
            await this.recordatoriosService.cancelarPendientesPorVacuna(String(id));
          } catch (e) {
            console.warn('VacunasService - no se cancelaron recordatorios (fallecido):', e);
          }
        }
        return { action: 'skipped', reason: 'sin_fecha' };
      }
      if (vacuna.agendarRefuerzo === false) {
        if (id) {
          try {
            await this.recordatoriosService.cancelarPendientesPorVacuna(String(id));
          } catch (e) {
            console.warn('VacunasService - no se cancelaron recordatorios (no agendar):', e);
          }
        }
        return { action: 'skipped', reason: 'sin_fecha' };
      }
      return await this.recordatoriosService.asegurarRefuerzoDesdeVacuna({
        ...vacuna,
        id
      });
    } catch (e) {
      console.warn('VacunasService - fallo al asegurar recordatorio de refuerzo:', e);
      return undefined;
    }
  }

  /** Completa proximaAplicacion si hay intervalo y falta la fecha. */
  private enriquecerProximasFechas(vacuna: any): any {
    const copy = { ...vacuna };
    delete copy.pacienteEstado;
    delete copy.clienteDisplay;
    delete copy.pacienteDisplay;
    if (copy.agendarRefuerzo === false) {
      return copy;
    }
    if (!copy.proximaAplicacion && copy.intervalo) {
      const prox = calcularProximaDesdeIntervalo(
        copy.fechaAplicacion || copy.fecha,
        copy.intervalo
      );
      if (prox) {
        copy.proximaAplicacion = formatRtdbLocal(prox).slice(0, 10);
      }
    }
    return copy;
  }

  // Restaurar vacuna
  restaurarVacuna(id: string): Promise<void> {
    return this.db.object(`Katzen/Vacunas/${id}`).update({ 
      activo: true,
      fechaEliminacion: null
    });
  }

  // Marcar vacuna como aplicada
  marcarAplicada(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Vacunas/${id}`).update({ 
      aplicada: true,
      fechaAplicacion: timestamp,
      fechaActualizacion: timestamp
    });
  }

  // Marcar vacuna como pendiente
  marcarPendiente(id: string): Promise<void> {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.db.object(`Katzen/Vacunas/${id}`).update({ 
      aplicada: false,
      fechaAplicacion: null,
      fechaActualizacion: timestamp
    });
  }

  // Obtener tipos de vacunas disponibles
  getTiposVacunas(): Observable<any[]> {
    return this.db.list('Katzen/TiposVacunas').snapshotChanges().pipe(
      map(changes => 
        changes.map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }))
      )
    );
  }

  // Generar ID único
  private generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Calcular próxima fecha de vacuna
  calcularProximaFecha(vacuna: any): string {
    const fecha = vacuna.fechaAplicacion || vacuna.fecha;
    if (!fecha || !vacuna.intervalo) return '';
    
    const fechaActual = new Date(fecha);
    const proximaFecha = new Date(fechaActual.getTime() + (vacuna.intervalo * 24 * 60 * 60 * 1000));
    
    return proximaFecha.toLocaleDateString('es-ES');
  }

  // Verificar si la vacuna está vencida
  estaVencida(vacuna: any): boolean {
    const fecha = vacuna.fechaAplicacion || vacuna.fecha;
    if (!fecha) return false;
    
    const fechaVacuna = new Date(fecha);
    const hoy = new Date();
    
    return fechaVacuna < hoy;
  }

  // Obtener días restantes para la vacuna
  getDiasRestantes(vacuna: any): number {
    const fecha = vacuna.proximaAplicacion || vacuna.fechaAplicacion || vacuna.fecha;
    if (!fecha) return 0;
    
    const fechaVacuna = new Date(fecha);
    const hoy = new Date();
    const diferencia = fechaVacuna.getTime() - hoy.getTime();
    
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }
} 