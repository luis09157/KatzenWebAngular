import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';

export interface ContactoWebPayload {
  nombre: string;
  email: string;
  telefono: string;
  mascota: string;
  mensaje: string;
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

  private clip(value: string, max: number): string {
    return String(value ?? '').trim().slice(0, max);
  }
}
