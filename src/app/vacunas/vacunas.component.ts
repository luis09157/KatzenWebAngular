import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VacunasService } from './vacunas.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { VacunaDialogComponent } from './vacuna-dialog.component';
import { SeleccionarClienteVacunaDialogComponent } from './seleccionar-cliente-vacuna-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { VacunaDetalleComponent } from './vacuna-detalle.component';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoggerService } from '../core/logger.service';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-vacunas',
  templateUrl: './vacunas.component.html',
  styleUrls: ['./vacunas.component.css']
})
export class VacunasComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['fecha_vacuna', 'paciente', 'tipo_vacuna', 'estado', 'proxima_dosis', 'veterinario', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;
  pacientesMap: { [id: string]: string } = {};
  loading = false;
  estadisticas = {
    total: 0,
    pendientes: 0,
    aplicadas: 0,
    pacientesUnicos: 0
  };

  constructor(
    private vacunasService: VacunasService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe(pacientes => {
      (pacientes || []).forEach((p: { id: string; nombre?: string }) => {
        this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
      });
      this.cargarVacunas();
    });
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarVacunas() {
    this.loading = true;
    this.vacunasService.getVacunas().pipe(takeUntil(this.destroy$)).subscribe({
      next: vacunas => {
        const vacunasActivas = (vacunas || []).filter((v: { activo?: boolean }) => v.activo !== false);
        this.dataSource.data = vacunasActivas.map((vacuna: any) => {
          const pacienteId = vacuna.paciente_id || vacuna.idPaciente;
          const fechaVacuna = vacuna.fecha_vacuna || vacuna.fechaAplicacion || vacuna.fecha_aplicacion || vacuna.fechaRegistro;
          const proximaDosis = vacuna.proxima_dosis || vacuna.proximaAplicacion || vacuna.proxima_aplicacion;
          const tipoVacuna = vacuna.tipo_vacuna || vacuna.vacuna;
          const veterinario = vacuna.veterinario || vacuna.veterinario_nombre || 'N/A';
          let estado = 'pendiente';
          if (vacuna.estado) {
            estado = vacuna.estado;
          } else if (vacuna.aplicada === true) {
            estado = 'aplicada';
          } else if (vacuna.aplicada === false) {
            estado = 'pendiente';
          }
          return {
            ...vacuna,
            paciente_id: pacienteId,
            paciente: this.pacientesMap[pacienteId] || 'N/P',
            fecha_vacuna: this.formatearFecha(fechaVacuna),
            proxima_dosis: this.formatearFecha(proximaDosis),
            tipo_vacuna: tipoVacuna,
            veterinario: veterinario,
            estado: estado
          };
        });
        this.calcularEstadisticas(vacunasActivas);
        this.loading = false;
        setTimeout(() => {
          if (this.paginator) this.dataSource.paginator = this.paginator;
        }, 0);
      },
      error: error => {
        this.logger.error('Error al cargar vacunas:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al Cargar Vacunas',
          html: `
            <p>No se pudieron cargar las vacunas del sistema.</p>
            <p class="text-muted">Por favor, verifica tu conexión e intenta de nuevo.</p>
          `,
          confirmButtonText: 'Reintentar',
          showCancelButton: true,
          cancelButtonText: 'Cerrar'
        }).then((result) => {
          if (result.isConfirmed) {
            this.cargarVacunas();
          }
        });
      }
    });
  }

  calcularEstadisticas(vacunas: any[]) {
    this.estadisticas.total = vacunas.length;
    this.estadisticas.pendientes = vacunas.filter(v => v.estado === 'pendiente' || !v.aplicada).length;
    this.estadisticas.aplicadas = vacunas.filter(v => v.estado === 'aplicada' || v.aplicada).length;
    
    // Pacientes únicos
    const pacientesIds = [...new Set(vacunas.map(v => v.paciente_id))];
    this.estadisticas.pacientesUnicos = pacientesIds.length;
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
    // Si es una vacuna existente (edición), abrir directamente
    if (vacuna && vacuna.id) {
      const dialogRef = this.dialog.open(VacunaDialogComponent, {
        width: '90vw',
        maxWidth: '95vw',
        data: vacuna
      });
      
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result) {
          this.loadingService.hide();
          this.cargarVacunas();
        }
      });
    } else {
      const seleccionDialogRef = this.dialog.open(SeleccionarClienteVacunaDialogComponent, {
        width: '80vw',
        maxWidth: '90vw',
        data: {}
      });
      seleccionDialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result && result.cliente && result.paciente) {
          const vacunaDialogRef = this.dialog.open(VacunaDialogComponent, {
            width: '90vw',
            maxWidth: '95vw',
            data: {
              idPaciente: result.paciente.id,
              cliente_id: result.cliente.id,
              paciente: result.paciente,
              cliente: result.cliente
            }
          });
          vacunaDialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(dialogResult => {
            if (dialogResult) {
              this.loadingService.hide();
              this.cargarVacunas();
            }
          });
        }
      });
    }
  }

  editarVacuna(vacuna: any) {
    this.abrirModalVacuna(vacuna);
  }

  verVacuna(vacuna: any) {
    const dialogRef = this.dialog.open(VacunaDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { ...vacuna, modoSoloLectura: true }
    });
  }

  verVacunaDetalle(vacuna: any) {
    const dialogRef = this.dialog.open(VacunaDetalleComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: vacuna
    });
  }

  async eliminarVacuna(vacuna: any) {
    const nombreVacuna = this.getNombreVacuna(vacuna.tipo_vacuna || vacuna.vacuna);
    const nombrePaciente = vacuna.paciente || 'N/P';
    
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Estás seguro?',
      html: `
        <p>Estás a punto de <strong>eliminar</strong> la siguiente vacuna:</p>
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
          <p><strong>Vacuna:</strong> ${nombreVacuna}</p>
          <p><strong>Paciente:</strong> ${nombrePaciente}</p>
          ${vacuna.fecha_vacuna ? `<p><strong>Fecha:</strong> ${vacuna.fecha_vacuna}</p>` : ''}
        </div>
        <p class="text-danger">Esta acción <strong>no se puede deshacer</strong>.</p>
      `,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      this.loadingService.show();
      try {
        await this.vacunasService.bajaLogicaVacuna(vacuna.id);
        this.loadingService.hide();
        setTimeout(() => {
          Swal.fire({ icon: 'success', title: '¡Vacuna Eliminada!', html: '<p>La vacuna ha sido eliminada correctamente.</p><p class="text-muted">El historial médico ha sido actualizado.</p>' });
          this.cargarVacunas();
        }, 0);
      } catch (error) {
        this.loadingService.hide();
        setTimeout(() => Swal.fire({ icon: 'error', title: 'Error al Eliminar', text: this.errorMessages.getUserMessage(error, 'eliminar vacuna') }), 0);
      }
    }
  }

  async cambiarEstado(vacuna: any, nuevoEstado: string) {
    this.loadingService.show();
    try {
      if (nuevoEstado === 'aplicada') {
        await this.vacunasService.marcarAplicada(vacuna.id);
      } else {
        await this.vacunasService.marcarPendiente(vacuna.id);
      }
      this.loadingService.hide();
      setTimeout(() => {
        Swal.fire({ icon: 'success', title: '¡Estado actualizado!', text: `Vacuna marcada como ${nuevoEstado}` });
        this.cargarVacunas();
      }, 0);
    } catch (error) {
      this.loadingService.hide();
      setTimeout(() => Swal.fire({ icon: 'error', title: 'Error', text: this.errorMessages.getUserMessage(error, 'cambiar estado vacuna') }), 0);
    }
  }

  getEstadoColor(estado: string | boolean): string {
    // Normalizar a string
    const estadoStr = typeof estado === 'boolean' 
      ? (estado ? 'aplicada' : 'pendiente') 
      : (estado || 'pendiente').toLowerCase();
    
    switch (estadoStr) {
      case 'aplicada':
      case 'completada':
        return '#4caf50'; // Verde
      case 'pendiente':
        return '#ff9800'; // Naranja
      case 'cancelada':
        return '#f44336'; // Rojo
      case 'en_proceso':
        return '#2196f3'; // Azul
      default:
        return '#9e9e9e'; // Gris
    }
  }

  getEstadoText(estado: string | boolean): string {
    // Normalizar a string
    const estadoStr = typeof estado === 'boolean' 
      ? (estado ? 'aplicada' : 'pendiente') 
      : (estado || 'pendiente').toLowerCase();
    
    switch (estadoStr) {
      case 'aplicada':
      case 'completada':
        return 'Aplicada';
      case 'pendiente':
        return 'Pendiente';
      case 'cancelada':
        return 'Cancelada';
      case 'en_proceso':
        return 'En Proceso';
      default:
        return 'Desconocido';
    }
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

  getVacunaColor(tipo: string): string {
    switch (tipo) {
      case 'quintuple':
        return '#4caf50';
      case 'sextuple':
        return '#2196f3';
      case 'antirrabica':
        return '#ff9800';
      case 'coronavirus':
        return '#f44336';
      case 'triple_felina':
        return '#9c27b0';
      case 'leucemia':
      case 'leucemia_felina':
        return '#00bcd4';
      case 'parvovirus':
        return '#795548';
      case 'moquillo':
        return '#607d8b';
      case 'hepatitis':
        return '#e91e63';
      case 'puppy':
        return '#673ab7';
      case 'bordetella':
        return '#009688';
      case 'giardia':
        return '#ff5722';
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