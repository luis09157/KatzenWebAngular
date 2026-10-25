import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { LoggerService } from '../logger.service';
import {
  debeCederFolio,
  folioDesdeConsecutivo,
  maxConsecutivoAnual,
  siguienteConsecutivoReservado,
} from '../utils/folio-expediente-paciente.util';

/** Contador aditivo. El personal ya puede escribir `Katzen/Config/Vacunacion`. */
const CONTADOR_PATH = 'Katzen/Config/Vacunacion/folioExpediente';

interface ContadorFolio {
  anio?: number;
  ultimo?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FolioExpedienteService {
  constructor(
    private db: AngularFireDatabase,
    private logger: LoggerService
  ) {}

  /** Lo que verá quien está dando de alta. No aparta el número. */
  async proponerSiguiente(anio = new Date().getFullYear()): Promise<string> {
    const [semilla, ultimoContador] = await Promise.all([this.maxConsecutivo(anio), this.leerContador(anio)]);
    return folioDesdeConsecutivo(anio, Math.max(semilla, ultimoContador) + 1);
  }

  /** Sale al instante con el contador, mientras la propuesta completa revisa los registros. */
  async propuestaRapida(anio = new Date().getFullYear()): Promise<string | null> {
    const ultimo = await this.leerContador(anio);
    if (ultimo <= 0) {
      return null;
    }
    return folioDesdeConsecutivo(anio, ultimo + 1);
  }

  /** Siguiente `260116`. La transacción serializa dos altas al mismo tiempo. */
  async reservarSiguiente(anio = new Date().getFullYear()): Promise<string> {
    const semilla = await this.maxConsecutivo(anio);
    try {
      const tx = await this.db.database.ref(CONTADOR_PATH).transaction((current) => {
        return siguienteConsecutivoReservado(current as ContadorFolio | null, anio, semilla);
      });
      const ultimo = Number((tx.snapshot.val() as ContadorFolio | null)?.ultimo);
      if (tx.committed && Number.isFinite(ultimo) && ultimo > 0) {
        return folioDesdeConsecutivo(anio, ultimo);
      }
    } catch (error) {
      this.logger.warn('No se pudo reservar el expediente en el contador', error);
    }
    return folioDesdeConsecutivo(anio, semilla + 1);
  }

  /**
   * Si otro registro quedó con el mismo número (alta simultánea), este cede
   * y guarda el siguiente. No recorre ni cambia folios viejos.
   */
  async asegurarUnico(
    id: string,
    folio: string,
    guardar: (folio: string) => Promise<void>,
    anio = new Date().getFullYear()
  ): Promise<string> {
    let actual = folio;
    for (let intento = 0; intento < 4; intento++) {
      const otros = await this.otrosIds(actual, id);
      if (!debeCederFolio(id, otros)) {
        return actual;
      }
      actual = await this.reservarSiguiente(anio);
      await guardar(actual);
    }
    return actual;
  }

  private async maxConsecutivo(anio: number): Promise<number> {
    const [mascotas, clientes] = await Promise.all([
      this.expedientesDe('Katzen/Mascota'),
      this.expedientesDe('Katzen/Cliente'),
    ]);
    return maxConsecutivoAnual([...mascotas, ...clientes], anio);
  }

  private async expedientesDe(path: string): Promise<unknown[]> {
    const snap = await this.db.database.ref(path).once('value');
    const val = snap.val() as Record<string, { expediente?: unknown }> | null;
    if (!val) {
      return [];
    }
    return Object.values(val).map((row) => row?.expediente);
  }

  private async otrosIds(folio: string, miId: string): Promise<string[]> {
    const buscado = String(folio || '').trim();
    if (!buscado) {
      return [];
    }
    const ids: string[] = [];
    for (const path of ['Katzen/Mascota', 'Katzen/Cliente']) {
      const snap = await this.db.database.ref(path).once('value');
      const val = snap.val() as Record<string, { expediente?: unknown }> | null;
      if (!val) {
        continue;
      }
      for (const [id, row] of Object.entries(val)) {
        if (id !== miId && String(row?.expediente || '').trim() === buscado) {
          ids.push(id);
        }
      }
    }
    return ids;
  }

  private async leerContador(anio: number): Promise<number> {
    try {
      const snap = await this.db.database.ref(CONTADOR_PATH).once('value');
      const val = snap.val() as ContadorFolio | null;
      const ultimo = Number(val?.ultimo);
      if (val?.anio === anio && Number.isFinite(ultimo) && ultimo > 0) {
        return ultimo;
      }
    } catch (error) {
      this.logger.warn('No se pudo leer la propuesta de expediente', error);
    }
    return 0;
  }
}
