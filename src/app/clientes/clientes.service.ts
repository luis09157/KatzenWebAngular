import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cliente } from '../core/models';
import { LoggerService } from '../core/logger.service';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  constructor(
    private db: AngularFireDatabase,
    private logger: LoggerService
  ) {}

  getClientes(): Observable<Cliente[]> {
    return this.db.list('Katzen/Cliente').snapshotChanges().pipe(
      map(actions => actions
        .map(a => {
          const clienteData = a.payload.val() as Record<string, unknown>;
          return {
            id: a.key,
            ...clienteData
          } as Cliente;
        })
        .filter((cliente: Cliente) => cliente.activo !== false)
        .sort((a, b) => {
          const fechaA = new Date((a as any).fecha_registro || (a as any).fecha_creacion || (a as any).created_at || 0);
          const fechaB = new Date((b as any).fecha_registro || (b as any).fecha_creacion || (b as any).created_at || 0);
          return fechaB.getTime() - fechaA.getTime();
        })
      )
    );
  }

  getCliente(id: string): Observable<Cliente | null> {
    return this.db.object(`Katzen/Cliente/${id}`).valueChanges() as Observable<Cliente | null>;
  }

  async guardarCliente(cliente: Cliente & { id?: string }): Promise<unknown> {
    cliente.activo = true;
    if (!cliente.id || String(cliente.id).trim() === '') {
      return this.db.list('Katzen/Cliente').push(cliente).then((result) => {
        const generatedId = result.key;
        if (generatedId) {
          return this.db.object(`Katzen/Cliente/${generatedId}`).update({ id: generatedId }).then(() => {
            return Promise.resolve();
          }).catch(error => {
            this.logger.error('❌ [SERVICIO] Error al actualizar ID:', error);
            throw error;
          });
        }
        return Promise.resolve();
      }).catch(error => {
        this.logger.error('❌ [SERVICIO] Error al crear cliente en Firebase:', error);
        throw error;
      });
    } else {
      return this.db.object(`Katzen/Cliente/${cliente.id}`).set(cliente).then(() => {
        return Promise.resolve();
      }).catch(error => {
        this.logger.error('❌ [SERVICIO] Error al actualizar cliente:', error);
        throw error;
      });
    }
  }

  actualizarCliente(id: string, cambios: Partial<Cliente>) {
    return this.db.object(`Katzen/Cliente/${id}`).update(cambios);
  }

  // Baja lógica: marcar como inactivo
  bajaLogicaCliente(id: string) {
    return this.db.object(`Katzen/Cliente/${id}`).update({ activo: false });
  }


} 