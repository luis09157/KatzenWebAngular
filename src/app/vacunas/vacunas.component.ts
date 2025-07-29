import { Component, OnInit, ViewChild } from '@angular/core';
import { VacunasService } from './vacunas.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { VacunaDialogComponent } from './vacuna-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2';
import { VacunaDetalleComponent } from './vacuna-detalle.component';

@Component({
  selector: 'app-vacunas',
  templateUrl: './vacunas.component.html',
  styleUrls: ['./vacunas.component.css']
})
export class VacunasComponent implements OnInit {
  displayedColumns: string[] = ['fecha', 'vacuna', 'dosis', 'estado', 'paciente', 'proximaAplicacion', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pacientesMap: { [id: string]: string } = {};

  constructor(
    private vacunasService: VacunasService,
    private pacientesService: PacientesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      (pacientes || []).forEach(p => {
        this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
      });
      this.cargarVacunas();
    });
  }

  cargarVacunas() {
    this.vacunasService.getVacunas().subscribe(vacunas => {
      this.dataSource.data = (vacunas || []).filter(v => v.activo !== false).map(vacuna => ({
        ...vacuna,
        paciente: this.pacientesMap[vacuna.idPaciente] || 'N/P',
        fecha: this.formatearFecha(vacuna.fecha),
        proximaAplicacion: this.formatearFecha(vacuna.proximaAplicacion),
        diasRestantes: this.vacunasService.getDiasRestantes(vacuna),
        estaVencida: this.vacunasService.estaVencida(vacuna)
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

  abrirModalVacuna(vacuna: any = null) {
    const dialogRef = this.dialog.open(VacunaDialogComponent, {
      width: '600px',
      data: vacuna
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarVacunas();
      }
    });
  }

  editarVacuna(vacuna: any) {
    this.abrirModalVacuna(vacuna);
  }

  verVacuna(vacuna: any) {
    const dialogRef = this.dialog.open(VacunaDialogComponent, {
      width: '600px',
      data: { ...vacuna, modoSoloLectura: true }
    });
  }

  verVacunaDetalle(vacuna: any) {
    const dialogRef = this.dialog.open(VacunaDetalleComponent, {
      width: '700px',
      data: vacuna
    });
  }

  async eliminarVacuna(vacuna: any) {
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
        await this.vacunasService.eliminarVacuna(vacuna.id);
        Swal.fire({
          icon: 'success',
          title: '¡Eliminado!',
          text: 'Vacuna eliminada correctamente'
        });
        this.cargarVacunas();
      } catch (error) {
        console.error('Error al eliminar vacuna:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo eliminar la vacuna'
        });
      }
    }
  }

  async cambiarEstado(vacuna: any, nuevoEstado: string) {
    try {
      if (nuevoEstado === 'aplicada') {
        await this.vacunasService.marcarAplicada(vacuna.id);
      } else {
        await this.vacunasService.marcarPendiente(vacuna.id);
      }
      
      Swal.fire({
        icon: 'success',
        title: '¡Estado actualizado!',
        text: `Vacuna marcada como ${nuevoEstado}`
      });
      
      this.cargarVacunas();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo cambiar el estado de la vacuna'
      });
    }
  }

  getEstadoColor(estado: boolean): string {
    return estado ? '#4caf50' : '#ff9800';
  }

  getEstadoText(estado: boolean): string {
    return estado ? 'Aplicada' : 'Pendiente';
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

  getDiasRestantesColor(dias: number): string {
    if (dias < 0) return '#f44336'; // Vencida
    if (dias <= 7) return '#ff9800'; // Próxima
    if (dias <= 30) return '#2196f3'; // En un mes
    return '#4caf50'; // Lejana
  }

  getDiasRestantesText(dias: number): string {
    if (dias < 0) return `Vencida hace ${Math.abs(dias)} días`;
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
} 