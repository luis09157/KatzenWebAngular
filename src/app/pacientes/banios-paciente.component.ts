import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { BaniosPacienteService, BanioPaciente } from './banios-paciente.service';
import { BaniosService } from '../banios/banios.service';
import { BanioDialogComponent } from '../banios/banio-dialog.component';
import { BanioDetalleComponent } from '../banios/banio-detalle.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-banios-paciente',
  templateUrl: './banios-paciente.component.html',
  styleUrls: ['./banios-paciente.component.css']
})
export class BaniosPacienteComponent implements OnInit {
  @Input() pacienteId: string = '';
  @Input() pacienteNombre: string = '';
  @Input() clienteNombre: string = '';
  @Output() banioCreado = new EventEmitter<any>();
  @Output() banioActualizado = new EventEmitter<any>();
  @Output() banioEliminado = new EventEmitter<any>();

  banios: BanioPaciente[] = [];
  baniosFiltrados: BanioPaciente[] = [];
  searchTerm: string = '';
  isLoading = false;

  // Estadísticas
  estadisticas = {
    total: 0,
    programados: 0,
    en_proceso: 0,
    completados: 0,
    cancelados: 0,
    ingresos_totales: 0
  };

  constructor(
    private baniosPacienteService: BaniosPacienteService,
    private baniosService: BaniosService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    if (this.pacienteId) {
      this.cargarBanios();
      this.cargarEstadisticas();
    }
  }

  ngOnChanges() {
    if (this.pacienteId) {
      this.cargarBanios();
      this.cargarEstadisticas();
    }
  }

  cargarBanios() {
    if (!this.pacienteId) return;
    
    this.isLoading = true;
    this.baniosPacienteService.getBaniosPorPaciente(this.pacienteId).subscribe({
      next: (banios) => {
        this.banios = banios;
        this.baniosFiltrados = banios;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar baños:', error);
        this.isLoading = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los baños del paciente',
          icon: 'error',
          confirmButtonText: 'Aceptar'
        });
      }
    });
  }

  cargarEstadisticas() {
    if (!this.pacienteId) return;
    
    console.log('📊 Cargando estadísticas para paciente:', this.pacienteId);
    
    this.baniosPacienteService.getEstadisticasBaniosPaciente(this.pacienteId).subscribe({
      next: (stats) => {
        console.log('📊 Estadísticas cargadas:', stats);
        this.estadisticas = stats;
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
      }
    });
  }

  onSearchInput(event: any) {
    this.searchTerm = event.target.value;
    this.filtrarBanios();
  }

  filtrarBanios() {
    if (!this.searchTerm.trim()) {
      this.baniosFiltrados = this.banios;
      return;
    }

    this.baniosPacienteService.buscarBaniosPaciente(this.pacienteId, this.searchTerm).subscribe({
      next: (banios) => {
        this.baniosFiltrados = banios;
      },
      error: (error) => {
        console.error('Error al buscar baños:', error);
      }
    });
  }

  agregarBanio() {
    const dialogRef = this.dialog.open(BanioDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: {
        paciente_id: this.pacienteId,
        paciente: this.pacienteNombre,
        cliente: this.clienteNombre,
        paciente_nombre: this.pacienteNombre,
        cliente_nombre: this.clienteNombre,
        isEditMode: false,
        hidePatientInfo: true // Flag para ocultar campos de paciente/cliente
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarBanios();
        this.cargarEstadisticas();
        this.banioCreado.emit(result);
      }
    });
  }

  editarBanio(banio: BanioPaciente) {
    const dialogRef = this.dialog.open(BanioDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: {
        ...banio,
        paciente: this.pacienteNombre,
        cliente: this.clienteNombre,
        paciente_nombre: this.pacienteNombre,
        cliente_nombre: this.clienteNombre,
        isEditMode: true,
        hidePatientInfo: true // Flag para ocultar campos de paciente/cliente
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.cargarBanios();
        this.cargarEstadisticas();
        this.banioActualizado.emit(result);
      }
    });
  }

  verDetalleBanio(banio: BanioPaciente) {
    const dialogRef = this.dialog.open(BanioDetalleComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: banio
    });

    dialogRef.afterClosed().subscribe(result => {
      // No se necesita hacer nada después de cerrar el modal de detalle
    });
  }

  eliminarBanio(banio: BanioPaciente) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el baño del ${banio.fecha_formateada}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.baniosPacienteService.eliminarBanioPaciente(banio.id!).then(() => {
          Swal.fire({
            title: 'Eliminado',
            text: 'El baño ha sido eliminado correctamente',
            icon: 'success',
            confirmButtonText: 'Aceptar'
          });
          this.cargarBanios();
          this.cargarEstadisticas();
          this.banioEliminado.emit(banio);
        }).catch(error => {
          console.error('Error al eliminar baño:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar el baño',
            icon: 'error',
            confirmButtonText: 'Aceptar'
          });
        });
      }
    });
  }

  cambiarEstadoBanio(banio: BanioPaciente, nuevoEstado: string) {
    this.baniosPacienteService.cambiarEstadoBanioPaciente(banio.id!, nuevoEstado as any).then(() => {
      Swal.fire({
        title: 'Estado actualizado',
        text: `El baño ha sido marcado como ${nuevoEstado}`,
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      this.cargarBanios();
      this.cargarEstadisticas();
    }).catch(error => {
      console.error('Error al cambiar estado:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar el estado del baño',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    });
  }

  marcarComoPagado(banio: BanioPaciente) {
    this.baniosPacienteService.marcarComoPagado(banio.id!).then(() => {
      Swal.fire({
        title: 'Pago registrado',
        text: 'El baño ha sido marcado como pagado',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      });
      this.cargarBanios();
      this.cargarEstadisticas();
    }).catch(error => {
      console.error('Error al marcar como pagado:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo marcar como pagado',
        icon: 'error',
        confirmButtonText: 'Aceptar'
      });
    });
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
      default: return 'pets';
    }
  }
}
