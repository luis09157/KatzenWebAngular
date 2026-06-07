import { Component, Inject, ViewEncapsulation} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-citas-dia-dialog',
  templateUrl: './citas-dia-dialog.component.html',
  styleUrls: ['./citas-dia-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CitasDiaDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CitasDiaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      citas: any[];
      fecha: Date;
    }
  ) {}

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
        minute: '2-digit'
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