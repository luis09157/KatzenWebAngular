import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map } from 'rxjs';

export interface ContactoWebPayload {
  nombre: string;
  email: string;
  telefono: string;
  mascota: string;
  mensaje: string;
}

export interface ContactoWebRecord extends ContactoWebPayload {
  id: string;
  fecha: string;
  origen: string;
  leido: boolean;
  activo: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContactoWebService {
  private readonly basePath = 'Katzen/ContactosWeb';

  constructor(private db: AngularFireDatabase) {}

  async enviar(payload: ContactoWebPayload): Promise<string> {
    const record = {
      nombre: this.clip(payload.nombre, 100),
      email: this.clip(payload.email, 120).toLowerCase(),
      telefono: this.clip(payload.telefono, 20),
      mascota: this.clip(payload.mascota, 80),
      mensaje: this.clip(payload.mensaje, 2000),
      fecha: new Date().toISOString(),
      origen: 'landing',
      leido: false,
      activo: true
    };

    if (record.nombre.length < 2) {
      throw new Error('Nombre inválido');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      throw new Error('Email inválido');
    }
    if (record.mensaje.length < 10) {
      throw new Error('Mensaje muy corto');
    }

    const ref = await this.db.list(this.basePath).push(record);
    if (!ref.key) {
      throw new Error('No se pudo guardar el mensaje');
    }
    return ref.key;
  }

  getContactos(): Observable<ContactoWebRecord[]> {
    return this.db.list(this.basePath).snapshotChanges().pipe(
      map(changes =>
        changes
          .map(c => ({
            id: c.payload.key as string,
            ...(c.payload.val() as Omit<ContactoWebRecord, 'id'>)
          }))
          .filter(c => c.activo !== false)
          .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''))
      )
    );
  }

  async marcarLeido(id: string, leido: boolean): Promise<void> {
    await this.db.object(`${this.basePath}/${id}`).update({ leido });
  }

  private clip(value: string, max: number): string {
    return String(value ?? '').trim().slice(0, max);
  }
}
