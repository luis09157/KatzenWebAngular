import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  constructor(private db: AngularFireDatabase) {}

  // Migrar historiales existentes para eliminar campos duplicados
  async migrarHistoriales(): Promise<void> {
    try {
      const historialesRef = this.db.list('Katzen/Historiales_Clinicos');
      
      // Obtener todos los historiales
      const historialesSnapshot = await historialesRef.snapshotChanges().toPromise();
      
      if (!historialesSnapshot) {
        console.log('No hay historiales para migrar');
        return;
      }

      let procesados = 0;
      const total = historialesSnapshot.length;

      for (const change of historialesSnapshot) {
        const historialId = change.payload.key;
        const historial = change.payload.val() as any;

        if (historial) {
          // Crear objeto con solo los campos nuevos
          const historialMigrado = {
            // Campos nuevos
            historia_clinica: historial.historia_clinica || historial.diagnostico || '',
            diagnostico_presuntivo: historial.diagnostico_presuntivo || historial.diagnostico || '',
            manejo_terapeutico: historial.manejo_terapeutico || historial.tratamiento || '',
            peso: historial.peso || '',
            tr: historial.tr || '',
            hallazgos: historial.hallazgos || '',
            estudios_solicitados: historial.estudios_solicitados || '',
            receta: historial.receta || historial.medicamentos || '',
            medico_atendio: historial.medico_atendio || '',
            archivos: historial.archivos || [],
            
            // Campos del sistema
            paciente_id: historial.paciente_id,
            created_at: historial.created_at || historial.fecha_registro,
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
            fecha_registro: historial.fecha_registro || historial.created_at,
            activo: historial.activo !== false
          };

          // Actualizar el historial en la base de datos
          await this.db.object(`Katzen/Historiales_Clinicos/${historialId}`).update(historialMigrado);
          
          procesados++;
          console.log(`Historial ${historialId} migrado (${procesados}/${total})`);
        }
      }

      console.log(`Migración completada. ${procesados} historiales procesados.`);
      
      Swal.fire({
        icon: 'success',
        title: 'Migración Completada',
        text: `Se han migrado ${procesados} historiales exitosamente.`
      });

    } catch (error) {
      console.error('Error durante la migración:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error en Migración',
        text: 'Ocurrió un error durante la migración de historiales.'
      });
      
      throw error;
    }
  }

  // Verificar si hay historiales que necesiten migración
  verificarHistorialesParaMigracion(): Observable<boolean> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => {
        return changes.some(change => {
          const historial = change.payload.val() as any;
          // Verificar si tiene campos duplicados
          return historial && (
            historial.diagnostico || 
            historial.tratamiento || 
            historial.medicamentos || 
            historial.notas
          );
        });
      })
    );
  }

  // Obtener estadísticas de migración
  getEstadisticasMigracion(): Observable<any> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => {
        const historiales = changes.map(c => ({ id: c.payload.key, ...(c.payload.val() as any) }));
        
        const conCamposDuplicados = historiales.filter(h => 
          h.diagnostico || h.tratamiento || h.medicamentos || h.notas
        ).length;
        
        const conCamposNuevos = historiales.filter(h => 
          h.historia_clinica || h.diagnostico_presuntivo || h.manejo_terapeutico
        ).length;
        
        return {
          total: historiales.length,
          conCamposDuplicados,
          conCamposNuevos,
          necesitaMigracion: conCamposDuplicados > 0
        };
      })
    );
  }
}
