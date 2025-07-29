import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-recordatorio-detalle',
  templateUrl: './recordatorio-detalle.component.html',
  styleUrls: ['./recordatorio-detalle.component.css']
})
export class RecordatorioDetalleComponent {
  constructor(
    public dialogRef: MatDialogRef<RecordatorioDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    console.log('DATA RECIBIDA EN MODAL DETALLE RECORDATORIO:', data);
  }

  cerrar() {
    this.dialogRef.close();
  }

  formatearFecha(fecha: any): string {
    // Permitir pasar el objeto data directamente
    if (!fecha && this.data) {
      fecha = this.data.fecha_hora_recordatorio || this.data.fecha_recordatorio || null;
    }
    if (!fecha) return 'No disponible';
    try {
      const date = new Date(fecha);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      return 'No disponible';
    } catch {
      return 'No disponible';
    }
  }

  getEstadoColor(estado: any): string {
    if (estado === true || estado === 'completado' || estado === 'completo' || estado === 'true') {
      return '#4caf50';
    }
    if (estado === false || estado === 'pendiente' || estado === 'false') {
      return '#f44336';
    }
    return '#4caf50';
  }

  getPrioridadColor(prioridad: string): string {
    if (!prioridad) return '#888';
    switch (prioridad.toLowerCase()) {
      case 'alta': return '#e53935';
      case 'media': return '#fbc02d';
      case 'baja': return '#43a047';
      default: return '#888';
    }
  }

  getEstadoText(estado: any): string {
    if (estado === true || estado === 'completado' || estado === 'completo' || estado === 'true') {
      return 'Completado';
    }
    return 'Pendiente';
  }

  getTiempoRestante(fecha: any): string {
    if (!fecha && this.data) {
      fecha = this.data.fecha_hora_recordatorio || this.data.fecha_recordatorio || null;
    }
    if (!fecha) return '';
    try {
      const fechaRecordatorio = new Date(fecha);
      if (isNaN(fechaRecordatorio.getTime())) return '';
      const ahora = new Date();
      const diferencia = fechaRecordatorio.getTime() - ahora.getTime();
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      if (isNaN(dias)) return '';
      if (dias === 0) return 'Hoy';
      if (dias === 1) return 'Mañana';
      if (dias > 1) return `En ${dias} días`;
      if (dias < 0) return `Hace ${Math.abs(dias)} días`;
      return '';
    } catch {
      return '';
    }
  }

  // Métodos sin parámetros para usar en el template
  formatearFechaSinParametro(): string {
    return this.formatearFecha(null);
  }

  getTiempoRestanteSinParametro(): string {
    return this.getTiempoRestante(null);
  }
} 