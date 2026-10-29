/**
 * Spec 116.2 — «Receta para el dueño». Vista previa + dos botones:
 * «Enviar por WhatsApp» (abre el chat con el mensaje escrito; la veterinaria lo envía)
 * e «Imprimir / PDF». No se manda nada solo y no se guarda nada.
 */
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom, of, take, timeout, catchError } from 'rxjs';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_DETAIL } from '../core/config/admin-ui.config';
import { ClinicConfigService } from '../core/services/clinic-config.service';
import { getPacienteClienteId } from '../core/utils/paciente-cliente.util';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { puedeWebSharePdf } from '../visitas/ticket-digital.util';
import {
  buildRecetaView,
  nombreArchivoPdfReceta,
  RecetaHistorialInput,
  RecetaView,
  tieneContenidoReceta,
  urlWhatsAppReceta,
} from './receta-documento.util';

export interface RecetaDialogData {
  historial: RecetaHistorialInput & { paciente_id?: string; cliente_id?: string };
}

@Component({
  selector: 'app-receta-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './receta-dialog.component.html',
  styleUrls: ['./receta-dialog.component.scss'],
})
export class RecetaDialogComponent implements OnInit {
  cargando = true;
  ocupado = false;
  view: RecetaView | null = null;
  tieneContenido = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RecetaDialogData,
    private ref: MatDialogRef<RecetaDialogComponent>,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private clinicConfig: ClinicConfigService
  ) {}

  async ngOnInit(): Promise<void> {
    const h: RecetaDialogData['historial'] = this.data?.historial || {};
    this.tieneContenido = tieneContenidoReceta(h);
    const uno = <T>(o: import('rxjs').Observable<T>, def: T) =>
      firstValueFrom(
        o.pipe(
          take(1),
          timeout(8000),
          catchError(() => of(def))
        )
      );
    try {
      const pacienteId = String(h.paciente_id || '');
      const paciente = pacienteId ? await uno(this.pacientesService.getPaciente(pacienteId), null) : null;
      const clienteId = String(h.cliente_id || getPacienteClienteId(paciente) || '');
      const [cliente, clinica] = await Promise.all([
        clienteId ? uno(this.clientesService.getCliente(clienteId), null) : Promise.resolve(null),
        uno(this.clinicConfig.nombreClinica$(), ''),
      ]);
      this.view = buildRecetaView(h, paciente, cliente, clinica);
    } catch {
      this.view = buildRecetaView(h, null, null, '');
    } finally {
      this.cargando = false;
    }
  }

  get urlWhatsApp(): string | null {
    return this.view ? urlWhatsAppReceta(this.view) : null;
  }

  enviarWhatsApp(): void {
    const url = this.urlWhatsApp;
    if (!url) return;
    window.open(url, '_blank', 'noopener');
  }

  async imprimirPdf(): Promise<void> {
    if (!this.view || this.ocupado) return;
    // En computadora se abre la pestaña ya (si se abre después de esperar, el navegador la bloquea).
    const esCelular = puedeWebSharePdf() && window.matchMedia?.('(pointer: coarse)').matches;
    const ventana = esCelular ? null : window.open('', '_blank');
    this.ocupado = true;
    try {
      const { abrirOCompartirPdfReceta } = await import('./receta-pdf.util');
      const modo = await abrirOCompartirPdfReceta(
        this.view,
        nombreArchivoPdfReceta(this.view, this.data?.historial?.fecha_registro),
        ventana
      );
      if (modo === 'descargado') {
        Swal.fire({
          icon: 'success',
          title: 'PDF descargado',
          text: 'Ábrelo desde Descargas para imprimirlo o mandarlo.',
          timer: 2200,
          showConfirmButton: false,
        });
      }
    } catch {
      ventana?.close();
      Swal.fire('No se pudo hacer el PDF', 'Inténtalo otra vez.', 'error');
    } finally {
      this.ocupado = false;
    }
  }

  cerrar(): void {
    this.ref.close();
  }
}

/** Abre «Receta para el dueño» de una consulta. */
export function abrirRecetaDialog(dialog: MatDialog, historial: RecetaDialogData['historial']): void {
  dialog.open(RecetaDialogComponent, { ...ADMIN_DIALOG_DETAIL, width: '600px', data: { historial } });
}
