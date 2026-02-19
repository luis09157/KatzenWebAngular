import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CitasService } from './citas.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { MatDialog } from '@angular/material/dialog';
import { CitaDialogComponent } from './cita-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoggerService } from '../core/logger.service';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['fecha_hora', 'cliente', 'paciente', 'motivo', 'estado', 'veterinario', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  clientesMap: { [id: string]: string } = {};
  pacientesMap: { [id: string]: string } = {};
  loading = false;

  constructor(
    private citasService: CitasService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe(clientes => {
      (clientes || []).forEach((c: { id: string; nombre?: string; apellidoPaterno?: string }) => {
        this.clientesMap[c.id] = c.nombre ? c.nombre + (c.apellidoPaterno ? ' ' + c.apellidoPaterno : '') : 'N/P';
      });
      this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe(pacientes => {
        (pacientes || []).forEach((p: { id: string; nombre?: string }) => {
          this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
        });
        this.citasService.getCitas().pipe(takeUntil(this.destroy$)).subscribe(citas => {
          const citasInactivas = citas?.filter((c: { activo?: boolean }) => c.activo === false) || [];
          this.dataSource.data = (citas || [])
            .filter(c => c.activo !== false)
            .map(cita => ({
              ...cita,
              cliente: this.clientesMap[cita.cliente_id] || 'N/P',
              paciente: this.pacientesMap[cita.paciente_id] || 'N/P'
            }))
            .sort((a, b) => {
              const estadoA = (a.estado || '').toLowerCase();
              const estadoB = (b.estado || '').toLowerCase();
              const prioridadEstados: Record<string, number> = {
                'pendiente': 4,
                'confirmada': 3,
                'completada': 2,
                'cancelada': 1
              };
              const prioridadA = prioridadEstados[estadoA] || 0;
              const prioridadB = prioridadEstados[estadoB] || 0;
              if (prioridadA !== prioridadB) {
                return prioridadB - prioridadA;
              }
              const fechaA = new Date(a.fecha || a.fecha_hora || 0);
              const fechaB = new Date(b.fecha || b.fecha_hora || 0);
              return fechaA.getTime() - fechaB.getTime();
            });
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          
          // Configurar ordenamiento por defecto
          if (this.sort) {
            this.dataSource.sort = this.sort;
            // Ordenar por fecha_hora descendente por defecto
            this.sort.sort({
              id: 'fecha_hora',
              start: 'desc',
              disableClear: false
            });
          }
          
          this.loading = false;
        });
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit() {
    // Configurar paginador y ordenamiento después de que la vista esté lista
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
        // Ordenar por fecha_hora descendente por defecto
        this.sort.sort({
          id: 'fecha_hora',
          start: 'desc',
          disableClear: false
        });
      }
    }, 0);
  }

  getCitasPendientes(): number {
    return this.dataSource.data.filter(cita => cita.estado?.toLowerCase() === 'pendiente').length;
  }

  getCitasConfirmadas(): number {
    return this.dataSource.data.filter(cita => cita.estado?.toLowerCase() === 'confirmada').length;
  }

  getCitasCompletadas(): number {
    return this.dataSource.data.filter(cita => cita.estado?.toLowerCase() === 'completada').length;
  }

  getFechaFormateada(cita: any): string {
    // Usar el campo 'fecha' que es la fecha real de la cita
    if (cita.fecha) {
      try {
        const fecha = new Date(cita.fecha);
        if (!isNaN(fecha.getTime())) {
          const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          const resultado = fechaFormateada + ' ' + (cita.hora || '');
          return resultado;
        }
      } catch (error) {
        this.logger.error('❌ Error procesando fecha:', error);
      }
    }
    if (cita.fecha_hora) {
      try {
        const fecha = new Date(cita.fecha_hora);
        if (!isNaN(fecha.getTime())) {
          const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          const horaFormateada = fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
          return fechaFormateada + ' ' + horaFormateada;
        }
      } catch (error) {
        this.logger.error('❌ Error procesando fecha_hora:', error);
      }
    }
    
    return 'N/P';
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  getEstadoColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'pendiente':
        return '#ff9800';
      case 'confirmada':
        return '#2196f3';
      case 'completada':
        return '#4caf50';
      case 'cancelada':
        return '#f44336';
      default:
        return '#888';
    }
  }

  cambiarEstado(cita: any, nuevoEstado: string) {
    const citaActualizada = {
      ...cita,
      estado: nuevoEstado,
      fecha_actualizacion: new Date().toISOString()
    };
    this.loadingService.show();
    this.citasService.guardarCita(citaActualizada)
      .then(() => {
        this.loadingService.hide();
        setTimeout(() => {
          Swal.fire({
            title: '¡Éxito!',
            text: `Cita marcada como ${nuevoEstado.toUpperCase()}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.ngOnInit();
        }, 0);
      })
      .catch(error => {
        this.logger.error('❌ Error al cambiar estado:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire({
          title: 'Error',
          text: 'No se pudo cambiar el estado de la cita',
          icon: 'error'
        }), 0);
      });
  }

  abrirModalCita(cita: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(CitaDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { cita, modoVer }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && !modoVer) {
        this.loadingService.show();
        this.citasService.guardarCita(result)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Cita guardada correctamente',
                icon: 'success',
                confirmButtonText: 'Entendido'
              });
              this.ngOnInit();
            }, 0);
          })
          .catch(error => {
            this.logger.error('❌ Error al guardar cita:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire({
              title: 'Error al guardar cita',
              text: this.errorMessages.getUserMessage(error, 'guardar cita'),
              icon: 'error',
              confirmButtonText: 'Entendido'
            }), 0);
          });
      }
    });
  }

  editarCita(cita: any) {
    this.abrirModalCita(cita, false);
  }

  verCita(cita: any) {
    this.abrirModalCita(cita, true);
  }

  bajaLogicaCita(id: string) {
    const cita = this.dataSource.data.find(c => c.id === id);
    if (!id || id.length === 0) {
      this.logger.error('❌ ERROR: ID de cita inválido:', id);
      Swal.fire({
        title: 'Error',
        text: 'ID de cita inválido. No se puede eliminar.',
        icon: 'error'
      });
      return;
    }
    if (!cita) {
      this.logger.error('❌ ERROR: Cita no encontrada en dataSource con ID:', id);
      Swal.fire({
        title: 'Error',
        text: 'Cita no encontrada. No se puede eliminar.',
        icon: 'error'
      });
      return;
    }
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta cita? Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingService.show();
        this.citasService.bajaLogicaCita(id)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire({
                title: '¡Eliminado!',
                text: 'Cita eliminada correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.ngOnInit();
            }, 0);
          })
          .catch(error => {
            this.logger.error('❌ Error al eliminar cita:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire({
              title: 'Error',
              text: 'No se pudo eliminar la cita. Inténtalo de nuevo.',
              icon: 'error'
            }), 0);
          });
      }
    });
  }
}
