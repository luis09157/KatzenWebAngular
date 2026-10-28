import { Component, Injector, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import Swal from 'sweetalert2';
import { BaniosService } from '../banios/banios.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { buildTelUrl, formatearFechaLargaEs } from '../recordatorios/recordatorio-whatsapp.util';
import { cargarParaAvisar } from './para-avisar.loader';
import { AvisoPendiente, TIPO_AVISO_LABELS, campoMarcaAviso, hora12, listaNombres } from './para-avisar.util';

export interface ParaAvisarResultado {
  enviados: number;
  descartados: number;
  /** Cuántos quedan por avisar al cerrar. */
  quedan: number;
}

type EstadoFila = 'enviado' | 'descartado';

/**
 * Spec 111 (Etapa B) — «Para avisar hoy». Nada se manda solo: la veterinaria toca
 * «Enviar al cliente» (abre WhatsApp con el mensaje escrito) o «No avisar».
 */
@Component({
  selector: 'app-para-avisar-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './para-avisar-dialog.component.html',
  styleUrls: ['./para-avisar-dialog.component.scss'],
})
export class ParaAvisarDialogComponent implements OnInit {
  cargando = true;
  error = '';
  avisos: AvisoPendiente[] = [];
  estado = new Map<string, EstadoFila>();
  ocupado = new Set<string>();
  abierto = new Set<string>();
  readonly etiquetas = TIPO_AVISO_LABELS;

  constructor(
    private ref: MatDialogRef<ParaAvisarDialogComponent, ParaAvisarResultado>,
    private injector: Injector,
    private db: AngularFireDatabase
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.avisos = await cargarParaAvisar(this.injector);
    } catch (e) {
      this.error = 'No se pudo cargar la lista. Cierra y vuelve a abrir.';
    } finally {
      this.cargando = false;
    }
  }

  get quedan(): number {
    return this.avisos.filter((a) => !this.estado.has(a.clave)).length;
  }

  mascotas(a: AvisoPendiente): string {
    return listaNombres(a.mascotas);
  }

  cuando(a: AvisoPendiente): string {
    const fecha = formatearFechaLargaEs(a.fecha);
    const h = hora12(a.hora);
    if (a.tipo === 'banio_proximo') return a.detalle;
    return [fecha, h].filter(Boolean).join(' · ') + (a.detalle && a.tipo !== 'banio_manana' ? ` · ${a.detalle}` : '');
  }

  telUrl(a: AvisoPendiente): string {
    return a.telefono10 ? buildTelUrl(a.telefono10) : '';
  }

  toggleMensaje(a: AvisoPendiente): void {
    if (this.abierto.has(a.clave)) this.abierto.delete(a.clave);
    else this.abierto.add(a.clave);
  }

  /** Abre WhatsApp con el mensaje escrito y marca el aviso como enviado. */
  async enviar(a: AvisoPendiente): Promise<void> {
    if (!a.whatsappUrl) return;
    window.open(a.whatsappUrl, '_blank', 'noopener');
    await this.marcar(a, 'enviado');
  }

  async noAvisar(a: AvisoPendiente): Promise<void> {
    await this.marcar(a, 'descartado');
  }

  async copiar(a: AvisoPendiente): Promise<void> {
    try {
      await navigator.clipboard.writeText(a.mensaje);
      Swal.fire({ icon: 'success', title: 'Mensaje copiado', timer: 1200, showConfirmButton: false });
    } catch {
      Swal.fire('No se pudo copiar', 'Selecciona el texto del mensaje y cópialo a mano.', 'info');
    }
  }

  /** Quita la marca (por si se tocó por error). */
  async deshacer(a: AvisoPendiente): Promise<void> {
    const e = this.estado.get(a.clave);
    if (!e) return;
    await this.escribir(a, e, null, () => this.estado.delete(a.clave));
  }

  cerrar(): void {
    let enviados = 0;
    let descartados = 0;
    for (const e of this.estado.values()) {
      if (e === 'enviado') enviados++;
      else descartados++;
    }
    this.ref.close({ enviados, descartados, quedan: this.quedan });
  }

  private async marcar(a: AvisoPendiente, accion: EstadoFila): Promise<void> {
    await this.escribir(a, accion, Date.now(), () => this.estado.set(a.clave, accion));
  }

  private async escribir(a: AvisoPendiente, accion: EstadoFila, valor: number | null, ok: () => void): Promise<void> {
    if (this.ocupado.has(a.clave)) return;
    this.ocupado.add(a.clave);
    try {
      for (const r of a.refs) {
        const cambio = { [campoMarcaAviso(a.tipo, r.origen, accion)]: valor };
        if (r.origen === 'banio') {
          await this.injector.get(BaniosService).actualizarBanio(r.id, cambio as any);
        } else if (r.origen === 'cita') {
          await this.db.object(`Katzen/Citas/${r.id}`).update(cambio);
        } else {
          await this.injector.get(RecordatoriosService).actualizarRecordatorio(r.id, cambio);
        }
      }
      ok();
    } catch (e) {
      Swal.fire('No se pudo guardar', e instanceof Error ? e.message : 'Intenta de nuevo.', 'error');
    } finally {
      this.ocupado.delete(a.clave);
    }
  }
}
