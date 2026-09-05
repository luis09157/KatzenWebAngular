import { Component, Inject, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TOOLTIP_ATENDER_SIN_PACIENTE, puedeAtenderCita, pacienteIdDeCita } from '../citas/cita-atender.util';

@Component({
  selector: 'app-citas-dia-dialog',
  templateUrl: './citas-dia-dialog.component.html',
  styleUrls: ['./citas-dia-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CitasDiaDialogComponent {
  readonly tooltipAtenderSinPaciente = TOOLTIP_ATENDER_SIN_PACIENTE;

  constructor(
    public dialogRef: MatDialogRef<CitasDiaDialogComponent>,
    private router: Router,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      citas: any[];
      fecha: Date;
    }
  ) {}

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

  cerrar() {
    this.dialogRef.close();
  }
}
