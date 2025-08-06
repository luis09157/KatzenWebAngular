import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';

@Component({
  selector: 'app-historial-detalle',
  templateUrl: './historial-detalle.component.html',
  styleUrls: ['./historial-detalle.component.css']
})
export class HistorialDetalleComponent implements OnInit {
  pacienteInfo: any = null;
  clienteInfo: any = null;
  loading = true;

  constructor(
    public dialogRef: MatDialogRef<HistorialDetalleComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private pacientesService: PacientesService,
    private clientesService: ClientesService
  ) {
    console.log('DATA RECIBIDA EN MODAL DETALLE:', data);
  }

  ngOnInit() {
    this.cargarInformacion();
  }

  async cargarInformacion() {
    try {
      // Cargar información del paciente
      if (this.data.paciente_id) {
        this.pacientesService.getPaciente(this.data.paciente_id).subscribe(paciente => {
          this.pacienteInfo = paciente;
          this.loading = false;
        });
      }

      // Cargar información del cliente
      if (this.data.paciente_id) {
        this.pacientesService.getPaciente(this.data.paciente_id).subscribe(paciente => {
          if (paciente && (paciente.idCliente || paciente.cliente_id)) {
            const clienteId = paciente.idCliente || paciente.cliente_id;
            this.clientesService.getCliente(clienteId).subscribe(cliente => {
              this.clienteInfo = cliente;
              this.loading = false;
            });
          }
        });
      }
    } catch (error) {
      console.error('Error al cargar información:', error);
      this.loading = false;
    }
  }

  cerrar() {
    this.dialogRef.close();
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'No disponible';
    
    try {
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      if (typeof fecha === 'string') {
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
      }
      
      return 'No disponible';
    } catch (error) {
      return 'No disponible';
    }
  }

  getEstadoColor(estado: any): string {
    if (estado === true || estado === 'activo' || estado === 'true') {
      return '#4caf50';
    }
    if (estado === false || estado === 'inactivo' || estado === 'false') {
      return '#f44336';
    }
    return '#4caf50';
  }

  getEstadoText(estado: any): string {
    if (estado === false || estado === 'inactivo' || estado === 'false') {
      return 'Inactivo';
    }
    return 'Activo';
  }

  getTiempoTranscurrido(fecha: any): string {
    if (!fecha) return '';
    
    try {
      const fechaHistorial = new Date(fecha);
      const ahora = new Date();
      const diferencia = ahora.getTime() - fechaHistorial.getTime();
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      
      if (dias === 0) {
        return 'Hoy';
      } else if (dias === 1) {
        return 'Ayer';
      } else if (dias < 7) {
        return `Hace ${dias} días`;
      } else if (dias < 30) {
        const semanas = Math.floor(dias / 7);
        return `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
      } else {
        const meses = Math.floor(dias / 30);
        return `Hace ${meses} mes${meses > 1 ? 'es' : ''}`;
      }
    } catch (error) {
      return '';
    }
  }

  getNombrePaciente(): string {
    if (this.pacienteInfo && this.pacienteInfo.nombre) {
      return this.pacienteInfo.nombre;
    }
    return 'Paciente no encontrado';
  }

  getNombreCliente(): string {
    if (this.clienteInfo) {
      const nombre = this.clienteInfo.nombre || '';
      const apellidoPaterno = this.clienteInfo.apellidoPaterno || '';
      const apellidoMaterno = this.clienteInfo.apellidoMaterno || '';
      return [nombre, apellidoPaterno, apellidoMaterno].filter(Boolean).join(' ');
    }
    return 'Cliente no encontrado';
  }

  getInfoPaciente(): string {
    if (!this.pacienteInfo) return 'Información no disponible';
    
    const info = [];
    if (this.pacienteInfo.especie) info.push(this.pacienteInfo.especie);
    if (this.pacienteInfo.raza) info.push(this.pacienteInfo.raza);
    if (this.pacienteInfo.sexo) info.push(this.pacienteInfo.sexo);
    
    return info.length > 0 ? info.join(', ') : 'Información no disponible';
  }
} 