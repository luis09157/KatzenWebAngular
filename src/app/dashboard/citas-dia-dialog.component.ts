import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TOOLTIP_ATENDER_SIN_PACIENTE, puedeAtenderCita, pacienteIdDeCita } from '../citas/cita-atender.util';
import { etiquetaTipoServicioBanioNuevo } from '../banios/banio-tipos-servicio.util';
import { formatearFechaLocalEs } from '../shared/datepicker/datepicker.util';
import {
  AgendaEventoDia,
  AgendaEventoTipo,
  etiquetaAgendaTipo,
  resumenAgendaDia,
} from './dashboard-calendario.util';

export interface CitasDiaDialogData {
  fecha: Date;
  citas: any[];
  /** Citas + peluquería + pensión del día. Si falta, se arma solo con `citas`. */
  eventos?: AgendaEventoDia[];
  clientesMap?: Record<string, string>;
  pacientesMap?: Record<string, string>;
}

@Component({
  selector: 'app-citas-dia-dialog',
  templateUrl: './citas-dia-dialog.component.html',
  styleUrls: ['./citas-dia-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CitasDiaDialogComponent {
  readonly tooltipAtenderSinPaciente = TOOLTIP_ATENDER_SIN_PACIENTE;
  readonly eventos: AgendaEventoDia[];
  /** Citas como objeto original (motivo, observaciones, estado…). */
  readonly citas: any[];
  readonly otros: AgendaEventoDia[];
  readonly resumen: string;

  constructor(
    public dialogRef: MatDialogRef<CitasDiaDialogComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA)
    public data: CitasDiaDialogData
  ) {
    this.eventos = data.eventos?.length
      ? data.eventos
      : (data.citas || []).map((cita) => ({ tipo: 'cita' as const, id: cita.id, cita }));
    this.citas = this.eventos.filter((ev) => ev.tipo === 'cita' && ev.cita).map((ev) => ev.cita as any);
    this.otros = this.eventos.filter((ev) => ev.tipo !== 'cita');
    this.resumen = resumenAgendaDia(this.eventos);
  }

  puedeAtender(cita: { paciente_id?: string; idPaciente?: string } | null): boolean {
    return puedeAtenderCita(cita);
  }

  atender(cita: { paciente_id?: string; idPaciente?: string } | null): void {
    const id = pacienteIdDeCita(cita);
    if (!id) return;
    this.dialogRef.close();
    void this.router.navigate(['/admin/paciente'], { queryParams: { id } });
  }

  getHoraFormateada(cita: any): string {
    // Usar el campo 'hora' que es la hora correcta de la cita
    if (cita.hora) {
      return cita.hora;
    }

    // Fallback a fecha_hora si no hay hora
    if (cita.fecha_hora) {
      const fecha = new Date(cita.fecha_hora);
      return fecha.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return '00:00';
  }

  getEstadoClass(estado: string): string {
    const e = String(estado || 'pendiente').toLowerCase();
    if (e === 'confirmada' || e === 'completada' || e === 'pendiente' || e === 'cancelada') {
      return `cita-estado-badge--${e}`;
    }
    return 'cita-estado-badge--pendiente';
  }

  trackByCita(index: number, cita: any): any {
    return cita.id || index;
  }

  trackByEvento(index: number, ev: AgendaEventoDia): string {
    return `${ev.tipo}-${ev.id || index}`;
  }

  /* ── Peluquería / pensión ── */

  etiquetaTipo(tipo: AgendaEventoTipo): string {
    return etiquetaAgendaTipo(tipo);
  }

  mascota(ev: AgendaEventoDia): string {
    return this.data.pacientesMap?.[ev.paciente_id || ''] || ev.paciente || 'Mascota';
  }

  dueno(ev: AgendaEventoDia): string {
    return this.data.clientesMap?.[ev.cliente_id || ''] || ev.cliente || 'Dueño';
  }

  /** Peluquería: «Baño con corte · 10:30». Pensión: «Del 20/10/2026 al 27/10/2026» / «Desde el …, sin salida registrada». */
  detalle(ev: AgendaEventoDia): string {
    if (ev.tipo === 'peluqueria') {
      const servicio = etiquetaTipoServicioBanioNuevo(ev.servicio) || this.textoSuelto(ev.servicio) || 'Peluquería';
      return ev.hora ? `${servicio} · ${ev.hora}` : servicio;
    }
    const desde = ev.desde ? formatearFechaLocalEs(ev.desde) : '';
    const hasta = ev.hasta ? formatearFechaLocalEs(ev.hasta) : '';
    if (desde && hasta && desde !== hasta) return `Del ${desde} al ${hasta}`;
    if (desde && !hasta) return `Desde el ${desde}, sin salida registrada`;
    return desde ? `El ${desde}` : 'Estancia';
  }

  estado(ev: AgendaEventoDia): string {
    return this.textoSuelto(ev.estado);
  }

  irAModulo(ev: AgendaEventoDia): void {
    this.dialogRef.close();
    void this.router.navigate([ev.tipo === 'peluqueria' ? '/admin/banios' : '/admin/pension']);
  }

  private textoSuelto(valor: unknown): string {
    const limpio = String(valor || '').replace(/_/g, ' ').trim();
    return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : '';
  }

  cerrar() {
    this.dialogRef.close();
  }
}
