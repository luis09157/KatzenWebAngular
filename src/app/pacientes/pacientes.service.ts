import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PacientesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los pacientes (solo activos)
  getPacientes(): Observable<any[]> {
    return this.db.list('Katzen/Mascota').snapshotChanges().pipe(
      map(actions => actions
        .map(a => ({
          id: a.key,
          ...a.payload.val() as any
        }))
        .filter(paciente => paciente.activo !== false) // Solo pacientes activos
        .sort((a, b) => {
          const fechaA = new Date(a.fecha_creacion || a.fecha_registro || a.created_at || 0);
          const fechaB = new Date(b.fecha_creacion || b.fecha_registro || b.created_at || 0);
          return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
        })
      )
    );
  }

  // Obtener un paciente por id
  getPaciente(id: string): Observable<any> {
    return this.db.object(`Katzen/Mascota/${id}`).valueChanges();
  }

  // Agregar o actualizar un paciente (siempre con activo: true)
  guardarPaciente(paciente: any) {
    paciente.activo = true;
    return this.db.object(`Katzen/Mascota/${paciente.id}`).set(paciente);
  }

  // Crear un nuevo paciente
  crearPaciente(paciente: any): Promise<any> {
    paciente.activo = true;
    paciente.fecha_creacion = new Date().toISOString();
    return this.db.list('Katzen/Mascota').push(paciente).then((ref) => {
      return Promise.resolve(ref);
    });
  }

  // Eliminar un paciente permanentemente
  eliminarPaciente(id: string): Promise<void> {
    return this.db.object(`Katzen/Mascota/${id}`).remove();
  }

  // Actualizar solo algunos campos de un paciente
  actualizarPaciente(id: string, cambios: Partial<any>) {
    return this.db.object(`Katzen/Mascota/${id}`).update(cambios);
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaPaciente(id: string) {
    return this.db.object(`Katzen/Mascota/${id}`).update({ activo: false });
  }

  // Métodos para el Log de Actividades del Paciente
  agregarLogActividad(pacienteId: string, actividad: any): Promise<void> {
    console.log('Agregando log de actividad:', { pacienteId, actividad });
    
    // Verificar que pacienteId no esté vacío
    if (!pacienteId) {
      console.error('Error: pacienteId está vacío');
      return Promise.reject('pacienteId está vacío');
    }
    
    const logRef = this.db.list(`Katzen/Log_Paciente/${pacienteId}`);
    const logEntry = {
      ...actividad,
      fecha_creacion: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    console.log('Log entry a guardar:', logEntry);
    console.log('Ruta en Firebase:', `Katzen/Log_Paciente/${pacienteId}`);
    
    return logRef.push(logEntry).then((ref) => {
      console.log('Log de actividad guardado exitosamente con ID:', ref.key);
      return Promise.resolve();
    }).catch(error => {
      console.error('Error al guardar log de actividad:', error);
      return Promise.reject(error);
    });
  }

  getLogActividades(pacienteId: string): Observable<any[]> {
    console.log('Obteniendo log de actividades para paciente:', pacienteId);
    return this.db.list(`Katzen/Log_Paciente/${pacienteId}`)
      .snapshotChanges()
      .pipe(
        map(changes => {
          const log = changes
            .map(c => ({ id: c.payload.key, ...c.payload.val() as any }))
            .sort((a, b) => b.timestamp - a.timestamp); // Más reciente primero
          console.log('Log obtenido de Firebase:', log);
          return log;
        })
      );
  }

  // Métodos para registrar diferentes tipos de actividades
  registrarHistorialClinico(pacienteId: string, historial: any): Promise<void> {
    console.log('Registrando historial clínico en log:', { pacienteId, historial });
    
    const actividad = {
      tipo: 'historial_clinico',
      titulo: 'Historial Clínico',
      descripcion: historial.diagnostico_presuntivo || historial.diagnostico || 'Sin diagnóstico',
      icono: 'medical_services',
      color: '#7b2c5c',
      datos: {
        diagnostico: historial.diagnostico_presuntivo || historial.diagnostico || 'Sin diagnóstico',
        tratamiento: historial.manejo_terapeutico || historial.tratamiento || 'Sin tratamiento',
        medicamentos: historial.receta || historial.medicamentos || 'Sin medicamentos'
      }
    };
    
    return this.agregarLogActividad(pacienteId, actividad);
  }

  registrarVacuna(pacienteId: string, vacuna: any): Promise<void> {
    // Asegurar que fecha_aplicacion tenga un valor válido
    let fechaAplicacion = vacuna.fecha_aplicacion;
    if (!fechaAplicacion) {
      fechaAplicacion = new Date().toISOString();
      console.warn('PacientesService - fecha_aplicacion undefined, usando fecha actual:', fechaAplicacion);
    }
    
    return this.agregarLogActividad(pacienteId, {
      tipo: 'vacuna',
      titulo: 'Vacuna Aplicada',
      descripcion: `${vacuna.nombre_vacuna} - ${vacuna.dosis}`,
      icono: 'vaccines',
      color: '#4caf50',
      datos: {
        nombre_vacuna: vacuna.nombre_vacuna,
        dosis: vacuna.dosis,
        fecha_aplicacion: fechaAplicacion
      }
    });
  }

  registrarRecordatorio(pacienteId: string, recordatorio: any): Promise<void> {
    console.log('Registrando recordatorio en log:', { pacienteId, recordatorio });
    
    const actividad = {
      tipo: 'recordatorio',
      titulo: 'Recordatorio',
      descripcion: recordatorio.titulo || 'Sin título',
      icono: 'notifications',
      color: '#ff9800',
      datos: {
        titulo: recordatorio.titulo || 'Sin título',
        fecha_recordatorio: recordatorio.fecha_hora_recordatorio || recordatorio.fecha_recordatorio,
        prioridad: recordatorio.prioridad || 'media'
      }
    };
    
    return this.agregarLogActividad(pacienteId, actividad);
  }

  registrarCita(pacienteId: string, cita: any): Promise<void> {
    return this.agregarLogActividad(pacienteId, {
      tipo: 'cita',
      titulo: 'Cita Programada',
      descripcion: cita.motivo,
      icono: 'event',
      color: '#2196f3',
      datos: {
        motivo: cita.motivo,
        fecha_hora: cita.fecha_hora,
        estado: cita.estado
      }
    });
  }

  // Métodos para registrar ediciones
  registrarEdicionHistorialClinico(pacienteId: string, historial: any): Promise<void> {
    return this.agregarLogActividad(pacienteId, {
      tipo: 'historial_clinico_editado',
      titulo: 'Historial Clínico Editado',
      descripcion: historial.diagnostico_presuntivo || historial.diagnostico || 'Sin diagnóstico',
      icono: 'edit',
      color: '#ff9800',
      datos: {
        diagnostico: historial.diagnostico_presuntivo || historial.diagnostico || 'Sin diagnóstico',
        tratamiento: historial.manejo_terapeutico || historial.tratamiento || 'Sin tratamiento',
        medicamentos: historial.receta || historial.medicamentos || 'Sin medicamentos'
      }
    });
  }

  registrarEdicionVacuna(pacienteId: string, vacuna: any): Promise<void> {
    // Asegurar que fecha_aplicacion tenga un valor válido
    let fechaAplicacion = vacuna.fecha_aplicacion;
    if (!fechaAplicacion) {
      fechaAplicacion = new Date().toISOString();
      console.warn('PacientesService - fecha_aplicacion undefined en edición, usando fecha actual:', fechaAplicacion);
    }
    
    return this.agregarLogActividad(pacienteId, {
      tipo: 'vacuna_editada',
      titulo: 'Vacuna Editada',
      descripcion: `${vacuna.nombre_vacuna} - ${vacuna.dosis}`,
      icono: 'edit',
      color: '#ff9800',
      datos: {
        nombre_vacuna: vacuna.nombre_vacuna,
        dosis: vacuna.dosis,
        fecha_aplicacion: fechaAplicacion
      }
    });
  }

  registrarEdicionRecordatorio(pacienteId: string, recordatorio: any): Promise<void> {
    return this.agregarLogActividad(pacienteId, {
      tipo: 'recordatorio_editado',
      titulo: 'Recordatorio Editado',
      descripcion: recordatorio.titulo,
      icono: 'edit',
      color: '#ff9800',
      datos: {
        titulo: recordatorio.titulo,
        fecha_recordatorio: recordatorio.fecha_hora_recordatorio,
        prioridad: recordatorio.prioridad
      }
    });
  }

  // Métodos para registrar eliminaciones
  registrarEliminacionHistorialClinico(pacienteId: string, historial: any): Promise<void> {
    return this.agregarLogActividad(pacienteId, {
      tipo: 'historial_clinico_eliminado',
      titulo: 'Historial Clínico Eliminado',
      descripcion: historial.diagnostico_presuntivo || historial.diagnostico || 'Sin diagnóstico',
      icono: 'delete',
      color: '#f44336',
      datos: {
        diagnostico: historial.diagnostico_presuntivo || historial.diagnostico || 'Sin diagnóstico',
        tratamiento: historial.manejo_terapeutico || historial.tratamiento || 'Sin tratamiento',
        medicamentos: historial.receta || historial.medicamentos || 'Sin medicamentos'
      }
    });
  }

  registrarEliminacionVacuna(pacienteId: string, vacuna: any): Promise<void> {
    // Usar los campos correctos según la estructura de la base de datos
    const nombreVacuna = vacuna.vacuna || 'Vacuna sin nombre';
    const dosis = vacuna.dosis || 'Sin dosis';
    
    // Asegurar que fecha_aplicacion tenga un valor válido
    let fechaAplicacion = vacuna.fechaAplicacion || vacuna.fechaRegistro;
    if (!fechaAplicacion) {
      fechaAplicacion = new Date().toISOString();
      console.warn('PacientesService - fechaAplicacion undefined en eliminación, usando fecha actual:', fechaAplicacion);
    }
    
    return this.agregarLogActividad(pacienteId, {
      tipo: 'vacuna_eliminada',
      titulo: 'Vacuna Eliminada',
      descripcion: `${nombreVacuna} - ${dosis}`,
      icono: 'delete',
      color: '#f44336',
      datos: {
        nombre_vacuna: nombreVacuna,
        dosis: dosis,
        fecha_aplicacion: fechaAplicacion
      }
    });
  }

  registrarEliminacionRecordatorio(pacienteId: string, recordatorio: any): Promise<void> {
    return this.agregarLogActividad(pacienteId, {
      tipo: 'recordatorio_eliminado',
      titulo: 'Recordatorio Eliminado',
      descripcion: recordatorio.titulo,
      icono: 'delete',
      color: '#f44336',
      datos: {
        titulo: recordatorio.titulo,
        fecha_recordatorio: recordatorio.fecha_hora_recordatorio,
        prioridad: recordatorio.prioridad
      }
    });
  }

  // Método de prueba para verificar la conexión a Firebase
  probarLogActividad(pacienteId: string): Promise<void> {
    console.log('Probando log de actividad para paciente:', pacienteId);
    
    const actividadPrueba = {
      tipo: 'prueba',
      titulo: 'Prueba de Log',
      descripcion: 'Esta es una prueba del sistema de log',
      icono: 'info',
      color: '#2196f3',
      datos: {
        mensaje: 'Prueba exitosa',
        timestamp: new Date().toISOString()
      }
    };
    
    return this.agregarLogActividad(pacienteId, actividadPrueba);
  }
} 