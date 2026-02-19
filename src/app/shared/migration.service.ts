import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError, firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class MigrationService {
  constructor(private db: AngularFireDatabase) {}

  // Migrar historiales existentes para eliminar campos duplicados
  async migrarHistoriales(): Promise<void> {
    try {
      console.log('🚀 Iniciando migración de historiales...');
      
      const historialesRef = this.db.list('Katzen/Historiales_Clinicos');
      
      // Obtener todos los historiales
      const historialesSnapshot = await firstValueFrom(historialesRef.snapshotChanges());
      
      if (!historialesSnapshot || historialesSnapshot.length === 0) {
        console.log('ℹ️ No hay historiales para migrar');
        return;
      }

      let procesados = 0;
      let exitosos = 0;
      let errores = 0;
      const total = historialesSnapshot.length;

      console.log(`📊 Total de historiales a migrar: ${total}`);

      for (const change of historialesSnapshot) {
        const historialId = change.payload.key;
        const historial = change.payload.val() as any;

        if (historial) {
          try {
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
            
            exitosos++;
            console.log(`✅ Historial ${historialId} migrado exitosamente (${exitosos}/${total})`);
            
          } catch (error) {
            errores++;
            console.error(`❌ Error al migrar historial ${historialId}:`, error);
          }
          
          procesados++;
        }
      }

      console.log(`🎉 Migración completada. ${exitosos} exitosos, ${errores} errores de ${total} total`);
      
      if (errores > 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Migración Completada con Advertencias',
          text: `Se migraron ${exitosos} historiales exitosamente, pero ${errores} tuvieron errores. Revisa la consola para más detalles.`
        });
      } else {
        Swal.fire({
          icon: 'success',
          title: 'Migración Completada',
          text: `Se han migrado ${exitosos} historiales exitosamente. Todos los campos duplicados han sido eliminados.`
        });
      }

    } catch (error) {
      console.error('❌ Error crítico durante la migración:', error);
      
      Swal.fire({
        icon: 'error',
        title: 'Error en Migración',
        text: 'Ocurrió un error crítico durante la migración. Por favor, revisa la consola y contacta al administrador.'
      });
      
      throw error;
    }
  }

  // Verificar si hay historiales que necesiten migración
  verificarHistorialesParaMigracion(): Observable<boolean> {
    return this.db.list('Katzen/Historiales_Clinicos').snapshotChanges().pipe(
      map(changes => {
        const necesitaMigracion = changes.some(change => {
          const historial = change.payload.val() as any;
          // Verificar si tiene campos duplicados
          return historial && (
            historial.diagnostico || 
            historial.tratamiento || 
            historial.medicamentos || 
            historial.notas
          );
        });
        
        console.log(`🔍 Verificación de migración: ${necesitaMigracion ? 'Necesaria' : 'No necesaria'}`);
        return necesitaMigracion;
      }),
      catchError(error => {
        console.error('❌ Error al verificar migración:', error);
        return throwError(() => new Error('No se pudo verificar la necesidad de migración'));
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
        
        const estadisticas = {
          total: historiales.length,
          conCamposDuplicados,
          conCamposNuevos,
          necesitaMigracion: conCamposDuplicados > 0,
          porcentajeMigrado: historiales.length > 0 ? Math.round((conCamposNuevos / historiales.length) * 100) : 0
        };
        
        console.log('📊 Estadísticas de migración:', estadisticas);
        return estadisticas;
      }),
      catchError(error => {
        console.error('❌ Error al obtener estadísticas de migración:', error);
        return throwError(() => new Error('No se pudieron obtener las estadísticas de migración'));
      })
    );
  }
}
