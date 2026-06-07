import { Component, Inject, ViewEncapsulation} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-vacuna-detalle',
  templateUrl: './vacuna-detalle.component.html',
  styleUrls: ['./vacuna-detalle.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VacunaDetalleComponent {
  // Mapa de tipos de vacunas para conversión rápida
  private tiposVacunasMap: { [key: string]: string } = {
    'puppy': 'Puppy',
    'quintuple': 'Quíntuple',
    'sextuple': 'Séxtuple',
    'triple_felina': 'Triple Felina',
    'antirrabica': 'Antirrábica',
    'bordetella': 'Bordetella',
    'leucemia_felina': 'Leucemia Felina',
    'giardia': 'Giardia',
    'coronavirus': 'Coronavirus',
    'parvovirus': 'Parvovirus',
    'moquillo': 'Moquillo',
    'hepatitis': 'Hepatitis',
    'leucemia': 'Leucemia',
    'otra': 'Otra'
  };

  constructor(
    public dialogRef: MatDialogRef<VacunaDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  cerrar() {
    this.dialogRef.close();
  }

  // Convertir valor técnico a nombre formateado
  getNombreVacuna(value: string): string {
    if (!value) return 'N/A';
    
    // Intentar obtener del mapa
    if (this.tiposVacunasMap[value]) {
      return this.tiposVacunasMap[value];
    }
    
    // Si no está en el mapa, formatear el valor
    // Reemplazar guiones bajos por espacios y capitalizar cada palabra
    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getVacunaIcono(tipo: string): string {
    switch (tipo) {
      case 'quintuple':
        return 'vaccines';
      case 'sextuple':
        return 'vaccines';
      case 'antirrabica':
        return 'security';
      case 'coronavirus':
        return 'coronavirus';
      case 'triple_felina':
        return 'pets';
      case 'leucemia':
        return 'healing';
      case 'parvovirus':
        return 'bug_report';
      case 'moquillo':
        return 'sick';
      case 'hepatitis':
        return 'medical_services';
      default:
        return 'vaccines';
    }
  }

  getVacunaColor(tipo: string): string {
    switch (tipo) {
      case 'quintuple':
        return '#4caf50';
      case 'sextule':
        return '#2196f3';
      case 'antirrabica':
        return '#ff9800';
      case 'coronavirus':
        return '#f44336';
      case 'triple_felina':
        return '#9c27b0';
      case 'leucemia':
        return '#00bcd4';
      case 'parvovirus':
        return '#795548';
      case 'moquillo':
        return '#607d8b';
      case 'hepatitis':
        return '#e91e63';
      default:
        return '#666';
    }
  }

  getEstadoColor(estado: boolean): string {
    return estado ? '#4caf50' : '#ff9800';
  }

  getEstadoText(estado: boolean): string {
    return estado ? 'Aplicada' : 'Pendiente';
  }

  getDiasRestantesColor(dias: number): string {
    if (dias < 0) return '#f44336'; // Vencida
    if (dias <= 7) return '#ff9800'; // Próxima
    if (dias <= 30) return '#2196f3'; // En un mes
    return '#4caf50'; // Lejana
  }

  getDiasRestantesText(dias: number): string {
    if (dias < 0) return `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) > 1 ? 's' : ''}`;
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    if (dias < 7) return `En ${dias} días`;
    if (dias < 30) {
      const semanas = Math.ceil(dias / 7);
      return `En ${semanas} semana${semanas > 1 ? 's' : ''}`;
    }
    const meses = Math.ceil(dias / 30);
    return `En ${meses} mes${meses > 1 ? 'es' : ''}`;
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'No especificada';
    
    try {
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
      
      return 'Fecha inválida';
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  formatearHora(fecha: any): string {
    if (!fecha) return '';
    
    try {
      if (fecha instanceof Date) {
        return fecha.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      return '';
    } catch (error) {
      return '';
    }
  }
} 