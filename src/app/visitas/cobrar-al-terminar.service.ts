/**
 * Spec 116.3 — «¿Cobrar ahora?» al terminar una consulta o vacuna.
 * «Cobrar ahora» = mismo camino que «Enviar a cobrar»: pide el monto, agrega la línea al
 * ticket del día y abre Cobrar. Se espera a que se cierre Cobrar antes de regresar, para que
 * la pantalla que abrió el formulario (p. ej. «Llegó un paciente») no lo cierre al navegar.
 * «Después» deja todo como antes (se cobra desde Cobrar o «Enviar a cobrar»).
 */
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoggerService } from '../core/logger.service';
import { CobroAlTerminarPregunta } from './cobrar-al-terminar.util';
import { promptMontoVisita } from './visita-atalho.util';
import { VisitaDialogComponent } from './visita-dialog.component';
import { VisitasService } from './visitas.service';

export type CobroAlTerminarResultado = 'cobrado' | 'despues' | 'sin_dueno' | 'error';

function escapar(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

@Injectable({ providedIn: 'root' })
export class CobrarAlTerminarService {
  constructor(
    private visitasService: VisitasService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {}

  async ofrecer(p: CobroAlTerminarPregunta): Promise<CobroAlTerminarResultado> {
    const l = p.linea;
    const detalle = p.detalle ? `<p style="margin:0 0 10px;white-space:pre-line">${escapar(p.detalle)}</p>` : '';
    const ask = await Swal.fire({
      icon: 'success',
      title: p.titulo,
      html: `${detalle}<p style="margin:0">¿Cobras ahora a <strong>${escapar(l.paciente)}</strong>?</p>`,
      showCancelButton: true,
      confirmButtonText: 'Cobrar ahora',
      cancelButtonText: 'Después',
      reverseButtons: true,
      focusConfirm: true,
    });
    if (!ask.isConfirmed) return 'despues';

    if (!l.cliente_id) {
      await Swal.fire({
        icon: 'warning',
        title: 'Falta el dueño',
        text: 'No se encontró el dueño de la mascota. Cóbralo desde Cobrar.',
      });
      return 'sin_dueno';
    }

    const esVacuna = l.categoria === 'vacuna';
    const monto = await promptMontoVisita(
      esVacuna ? 'Monto de la vacuna' : 'Monto de la consulta',
      `¿Cuánto se cobra a ${l.paciente}?`,
      { sugerido: l.montoSugerido, forzarDialogo: true }
    );
    if (monto == null || !(monto > 0)) return 'despues';

    try {
      const { visitaId } = await this.visitasService.agregarServicioAVisita({
        cliente_id: l.cliente_id,
        cliente: l.cliente,
        paciente_id: l.paciente_id || undefined,
        paciente: l.paciente,
        descripcion: l.descripcion,
        monto,
        categoria: l.categoria,
        historialId: l.historialId,
        vacunaId: l.vacunaId,
        fecha: l.fecha,
      });
      const visita = await this.visitasService.getVisita(visitaId);
      const ref = this.dialog.open(VisitaDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        data: { visita: visita || undefined, cliente_id: l.cliente_id, cliente: l.cliente },
      });
      await firstValueFrom(ref.afterClosed());
      return 'cobrado';
    } catch (error) {
      this.logger.error('Cobrar al terminar:', error);
      await Swal.fire('Error', this.errorMessages.getUserMessage(error, 'agregar a visita'), 'error');
      return 'error';
    }
  }
}
