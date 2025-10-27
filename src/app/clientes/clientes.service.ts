import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  constructor(private db: AngularFireDatabase) {}

  // Obtener todos los clientes (solo activos)
  getClientes(): Observable<any[]> {
    return this.db.list('Katzen/Cliente').snapshotChanges().pipe(
      map(actions => actions
        .map(a => {
          const clienteData = a.payload.val() as any;
          return {
            id: a.key, // Usar la key de Firebase como ID
            ...clienteData
          };
        })
        .filter(cliente => cliente.activo !== false) // Solo clientes activos
        .sort((a, b) => {
          const fechaA = new Date(a.fecha_registro || a.fecha_creacion || a.created_at || 0);
          const fechaB = new Date(b.fecha_registro || b.fecha_creacion || b.created_at || 0);
          return fechaB.getTime() - fechaA.getTime(); // Más nuevo arriba
        })
      )
    );
  }

  // Obtener un cliente por id
  getCliente(id: string): Observable<any> {
    return this.db.object(`Katzen/Cliente/${id}`).valueChanges();
  }

  // Agregar o actualizar un cliente (siempre con activo: true)
  async guardarCliente(cliente: any): Promise<any> {
    console.log('🔄 [SERVICIO] Iniciando guardado de cliente...');
    console.log('📝 [SERVICIO] Datos del cliente:', cliente);
    
    cliente.activo = true;
    
    // Si es un cliente nuevo (sin ID), usar push() para generar ID automáticamente
    if (!cliente.id || cliente.id.trim() === '') {
      console.log('🔄 [SERVICIO] Guardando cliente nuevo en Firebase...');
      console.log('📝 [SERVICIO] Datos a enviar a Firebase:', cliente);
      
      return this.db.list('Katzen/Cliente').push(cliente).then((result) => {
        console.log('✅ [SERVICIO] Cliente creado en Firebase:', result.key);
        // Obtener el ID generado por Firebase
        const generatedId = result.key;
        if (generatedId) {
          console.log('🔄 [SERVICIO] Actualizando cliente con ID:', generatedId);
          // Actualizar el cliente con el ID generado en los datos
          return this.db.object(`Katzen/Cliente/${generatedId}`).update({ id: generatedId }).then(() => {
            console.log('✅ [SERVICIO] ID actualizado correctamente');
            return Promise.resolve();
          }).catch(error => {
            console.error('❌ [SERVICIO] Error al actualizar ID:', error);
            throw error;
          });
        }
        console.log('⚠️ [SERVICIO] No se generó ID, resolviendo promesa');
        return Promise.resolve();
      }).catch(error => {
        console.error('❌ [SERVICIO] Error al crear cliente en Firebase:', error);
        throw error;
      });
    } else {
      // Si es una actualización, usar set() con el ID existente
      console.log('🔄 [SERVICIO] Actualizando cliente existente en Firebase...');
      return this.db.object(`Katzen/Cliente/${cliente.id}`).set(cliente).then(() => {
        console.log('✅ [SERVICIO] Cliente actualizado correctamente');
        return Promise.resolve();
      }).catch(error => {
        console.error('❌ [SERVICIO] Error al actualizar cliente:', error);
        throw error;
      });
    }
  }

  // Actualizar solo algunos campos de un cliente
  actualizarCliente(id: string, cambios: Partial<any>) {
    return this.db.object(`Katzen/Cliente/${id}`).update(cambios);
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaCliente(id: string) {
    return this.db.object(`Katzen/Cliente/${id}`).update({ activo: false });
  }


} 