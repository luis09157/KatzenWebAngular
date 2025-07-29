import { Component, OnInit, ViewChild } from '@angular/core';
import { RecordatoriosService } from './recordatorios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { RecordatorioDialogComponent } from './recordatorio-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-recordatorios',
  templateUrl: './recordatorios.component.html',
  styleUrls: ['./recordatorios.component.css']
})
export class RecordatoriosComponent implements OnInit {
  displayedColumns: string[] = ['fecha_recordatorio', 'titulo', 'tipo', 'estado', 'prioridad', 'paciente', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pacientesMap: { [id: string]: string } = {};

  constructor(
    private recordatoriosService: RecordatoriosService,
    private pacientesService: PacientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      (pacientes || []).forEach(p => {
        this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
      });
      this.cargarRecordatorios();
    });
  }

  cargarRecordatorios() {
    this.recordatoriosService.getRecordatorios().subscribe(recordatorios => {
      this.dataSource.data = (recordatorios || []).filter(r => r.activo !== false).map(recordatorio => ({
        ...recordatorio,
        paciente: this.pacientesMap[recordatorio.paciente_id] || 'N/P',
        fecha_recordatorio: this.formatearFecha(recordatorio.fecha_recordatorio)
      }));
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
    });
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/P';
    
    try {
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      }
      
      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      }
      
      return 'N/P';
    } catch (error) {
      return 'N/P';
    }
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  abrirModalRecordatorio(recordatorio: any = null) {
    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      width: '600px',
      data: recordatorio
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarRecordatorios();
      }
    });
  }

  editarRecordatorio(recordatorio: any) {
    this.abrirModalRecordatorio(recordatorio);
  }

  verRecordatorio(recordatorio: any) {
    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      width: '600px',
      data: { ...recordatorio, modoSoloLectura: true }
    });
  }

  async eliminarRecordatorio(recordatorio: any) {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await this.recordatoriosService.eliminarRecordatorio(recordatorio.id);
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Recordatorio eliminado correctamente'
        });
        this.cargarRecordatorios();
      } catch (error) {
        console.error('Error al eliminar recordatorio:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar el recordatorio'
        });
      }
    }
  }

  async cambiarEstado(recordatorio: any, nuevoEstado: string) {
    try {
      if (nuevoEstado === 'completado') {
        await this.recordatoriosService.marcarCompletado(recordatorio.id);
      } else {
        await this.recordatoriosService.marcarPendiente(recordatorio.id);
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Estado actualizado!',
        text: `Recordatorio marcado como ${nuevoEstado}`
      });
      
      this.cargarRecordatorios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cambiar el estado del recordatorio'
      });
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'completado':
        return '#4caf50';
      case 'pendiente':
        return '#ff9800';
      case 'cancelado':
        return '#f44336';
      default:
        return '#666';
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'urgente':
        return '#9c27b0';
      case 'alta':
        return '#f44336';
      case 'media':
        return '#ff9800';
      case 'baja':
        return '#4caf50';
      default:
        return '#666';
    }
  }

  getTipoIcono(tipo: string): string {
    switch (tipo) {
      case 'vacuna':
        return 'vaccines';
      case 'desparasitacion':
        return 'bug_report';
      case 'consulta':
        return 'medical_services';
      case 'cirugia':
        return 'healing';
      case 'revision':
        return 'visibility';
      case 'medicamento':
        return 'medication';
      default:
        return 'notifications';
    }
  }
} 