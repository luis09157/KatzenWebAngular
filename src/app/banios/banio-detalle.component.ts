import { Component, Inject, ViewEncapsulation} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Banio } from '../shared/banio.model';

@Component({
  selector: 'app-banio-detalle',
  templateUrl: './banio-detalle.component.html',
  styleUrls: ['./banio-detalle.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BanioDetalleComponent {
  banio: any;

  constructor(
    public dialogRef: MatDialogRef<BanioDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.banio = data;
  }

  cerrar() {
    this.dialogRef.close();
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'programado': return '#2196F3';
      case 'en_proceso': return '#FF9800';
      case 'completado': return '#4CAF50';
      case 'cancelado': return '#F44336';
      default: return '#757575';
    }
  }

  getEstadoIcon(estado: string): string {
    switch (estado) {
      case 'programado': return 'schedule';
      case 'en_proceso': return 'play_circle';
      case 'completado': return 'check_circle';
      case 'cancelado': return 'cancel';
      default: return 'help';
    }
  }

  getTipoServicioIcon(tipo: string): string {
    switch (tipo?.toLowerCase()) {
      case 'baño básico': return 'shower';
      case 'corte pelo': return 'content_cut';
      case 'baño completo': return 'bathtub';
      case 'corte y baño': return 'spa';
      case 'corte_uñas': return 'scissors';
      case 'deslanado': return 'brush';
      case 'tratamiento_especial': return 'healing';
      default: return 'pets';
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'baja': return '#4CAF50';
      case 'media': return '#FF9800';
      case 'alta': return '#F44336';
      case 'urgente': return '#9C27B0';
      default: return '#757575';
    }
  }

  getComportamientoIcon(comportamiento: string): string {
    switch (comportamiento) {
      case 'tranquilo': return 'sentiment_satisfied';
      case 'nervioso': return 'sentiment_dissatisfied';
      case 'agresivo': return 'sentiment_very_dissatisfied';
      case 'cooperativo': return 'thumb_up';
      default: return 'pets';
    }
  }

  formatearFecha(fecha: string): string {
    if (!fecha) return 'Fecha no disponible';
    
    try {
      // Intentar diferentes formatos de fecha
      let date: Date;
      
      // Si la fecha viene en formato YYYY-MM-DD
      if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
        date = new Date(fecha + 'T00:00:00');
      }
      // Si la fecha viene en formato YYYY-MM-DD HH:mm:ss
      else if (fecha.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        date = new Date(fecha.replace(' ', 'T'));
      }
      // Si la fecha viene en formato ISO
      else if (fecha.includes('T')) {
        date = new Date(fecha);
      }
      // Formato por defecto
      else {
        date = new Date(fecha);
      }
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida para formatear:', fecha);
        return 'Fecha inválida';
      }
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.warn('Error al formatear fecha:', fecha, error);
      return 'Error en fecha';
    }
  }

  // Método para obtener la fecha correcta del baño
  getFechaBanio(): string {
    const banio = this.banio;
    // Prioridad: fecha_banio > created_at > updated_at
    const fechaParaUsar = banio.fecha_banio || banio.created_at || banio.updated_at;
    return this.formatearFecha(fechaParaUsar);
  }

  formatearHora(hora: string): string {
    if (!hora) return 'Hora no disponible';
    return hora;
  }

  formatearPrecio(precio: number): string {
    if (!precio) return '$0';
    return `$${precio.toLocaleString('es-MX')}`;
  }

  // Método para obtener el nombre del servicio
  getNombreServicio(servicio: any): string {
    if (typeof servicio === 'string') {
      return servicio;
    } else if (servicio && typeof servicio === 'object') {
      return servicio.nombre || servicio.name || servicio.servicio || 'Servicio sin nombre';
    }
    return 'Servicio desconocido';
  }

  // Método para obtener el precio del servicio
  getPrecioServicio(servicio: any): number {
    if (typeof servicio === 'string') {
      return 0;
    } else if (servicio && typeof servicio === 'object') {
      return servicio.precio || servicio.price || servicio.costo || 0;
    }
    return 0;
  }
}
