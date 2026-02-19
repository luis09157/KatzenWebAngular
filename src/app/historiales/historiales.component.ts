import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { MigrationService } from '../shared/migration.service';
import { MatDialog } from '@angular/material/dialog';
import { HistorialDialogComponent } from './historial-dialog.component';
import { HistorialDetalleComponent } from './historial-detalle.component';
import { SeleccionarClienteDialogComponent } from './seleccionar-cliente-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-historiales',
  templateUrl: './historiales.component.html',
  styleUrls: ['./historiales.component.css']
})
export class HistorialesComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['fecha_registro', 'paciente', 'diagnostico_presuntivo', 'manejo_terapeutico', 'medico_atendio', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pacientesMap: { [id: string]: string } = {};
  estadisticas: any = { total: 0, activos: 0, inactivos: 0 };
  loading = false;
  necesitaMigracion = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private migrationService: MigrationService,
    private dialog: MatDialog,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.cargarDatos();
    this.cargarEstadisticas();
    this.verificarMigracion();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verificarMigracion() {
    this.migrationService.verificarHistorialesParaMigracion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (necesita) => {
          this.necesitaMigracion = necesita;
          console.log('✅ Verificación de migración completada:', necesita);
        },
        error: (error) => {
          console.error('❌ Error al verificar migración:', error);
          this.necesitaMigracion = false;
        }
      });
  }

  async ejecutarMigracion() {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Ejecutar Migración?',
      text: 'Esta acción actualizará todos los historiales existentes para eliminar campos duplicados. ¿Estás seguro?',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, ejecutar migración',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        this.loading = true;
        await this.migrationService.migrarHistoriales();
        
        // Recargar datos después de la migración
        this.cargarDatos();
        this.verificarMigracion();
        
        Swal.fire({
          icon: 'success',
          title: 'Migración Completada',
          text: 'La base de datos ha sido migrada exitosamente. Todos los historiales ahora usan la nueva estructura.'
        });
        
      } catch (error) {
        console.error('❌ Error en migración:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error en Migración',
          text: 'Ocurrió un error durante la migración. Por favor, inténtalo de nuevo.'
        });
      } finally {
        this.loading = false;
      }
    }
  }

  cargarDatos() {
    this.pacientesService.getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pacientes) => {
          (pacientes || []).forEach(p => {
            this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
          });
          this.cargarHistoriales();
        },
        error: (error) => {
          console.error('❌ Error al cargar pacientes:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los pacientes'
          });
        }
      });
  }

  cargarHistoriales() {
    this.historialesService.getHistorialesActivos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historiales) => {
          this.dataSource.data = (historiales || []).map(historial => ({
            ...historial,
            paciente: this.pacientesMap[historial.paciente_id] || 'N/P',
            fecha_registro: this.formatearFecha(historial.fecha_registro)
          }));
          
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          
          this.loading = false;
          console.log('✅ Historiales cargados:', this.dataSource.data.length);
        },
        error: (error) => {
          console.error('❌ Error al cargar historiales:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los historiales'
          });
        }
      });
  }

  cargarEstadisticas() {
    this.historialesService.getEstadisticasHistoriales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.estadisticas = stats;
          console.log('✅ Estadísticas cargadas:', stats);
        },
        error: (error) => {
          console.error('❌ Error al cargar estadísticas:', error);
        }
      });
  }

  getHistorialesRecientes(): number {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    return this.dataSource.data.filter(historial => {
      if (!historial.fecha_registro) return false;
      const fechaHistorial = new Date(historial.fecha_registro);
      return fechaHistorial >= hace30Dias;
    }).length;
  }

  getPacientesUnicos(): number {
    const pacientesUnicos = new Set(
      this.dataSource.data
        .map(historial => historial.paciente_id)
        .filter(id => id && id !== 'N/P')
    );
    return pacientesUnicos.size;
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/P';
    
    try {
      // Si es un objeto Date del DatePicker
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // Si es un string de fecha
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
      
      return 'N/P';
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'N/P';
    }
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  abrirModalHistorial(pacienteId?: string) {
    // Si es un nuevo historial (no hay paciente seleccionado), primero seleccionar cliente
    if (!pacienteId) {
      this.seleccionarClienteParaHistorial();
      return;
    }

    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { paciente_id: pacienteId }
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadingService.hide();
          this.cargarHistoriales();
          this.cargarEstadisticas();
        }
      });
  }

  seleccionarClienteParaHistorial() {
    const dialogRef = this.dialog.open(SeleccionarClienteDialogComponent, {
      width: '80vw',
      maxWidth: '90vw',
      disableClose: true
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result && result.cliente && result.paciente) {
          this.abrirModalHistorialConPaciente(result.paciente);
        }
      });
  }

  abrirModalHistorialConPaciente(paciente: any) {
    const historialNuevo = {
      paciente_id: paciente.id,
      paciente_nombre: paciente.nombre
    };

    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { historial: historialNuevo, modoVer: false }
    });
    
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadingService.hide();
          this.cargarHistoriales();
          this.cargarEstadisticas();
        }
      });
  }

  verHistorialDetalle(historial: any) {
    this.dialog.open(HistorialDetalleComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: historial
    });
  }

  editarHistorial(historial: any) {
    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { historial, modoVer: false }
    });
    
    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(result => {
        if (result) {
          this.loadingService.show();
          this.historialesService.actualizarHistorial(historial.id, result)
            .then(() => {
              this.pacientesService.registrarEdicionHistorialClinico(historial.paciente_id, result).then(() => {}).catch(() => {});
              this.loadingService.hide();
              setTimeout(() => {
                this.cargarHistoriales();
                this.cargarEstadisticas();
              }, 0);
            })
            .catch(error => {
              this.loadingService.hide();
              setTimeout(() => Swal.fire('Error', 'No se pudo actualizar el historial clínico', 'error'), 0);
            });
        }
      });
  }

  async bajaLogicaHistorial(id: string) {
    // Obtener los datos del historial antes de dar de baja para registrar en el log
    this.historialesService.getHistorial(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (historial) => {
        if (historial) {
          const result = await Swal.fire({
            icon: 'warning',
            title: '¿Estás seguro?',
            text: 'Esta acción marcará el historial como inactivo',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, marcar como inactivo',
            cancelButtonText: 'Cancelar'
          });

          if (result.isConfirmed) {
            this.loadingService.show();
            try {
              await this.historialesService.bajaLogicaHistorial(id);
              this.pacientesService.registrarEliminacionHistorialClinico(historial.paciente_id, historial).then(() => {}).catch(() => {});
              this.cargarHistoriales();
              this.cargarEstadisticas();
              this.loadingService.hide();
              setTimeout(() => Swal.fire({ icon: 'success', title: '¡Completado!', text: 'El historial ha sido marcado como inactivo' }), 0);
            } catch (error) {
              this.loadingService.hide();
              setTimeout(() => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo marcar el historial como inactivo' }), 0);
            }
          }
        }
      });
  }

  async eliminarHistorial(id: string) {
    // Obtener los datos del historial antes de eliminarlo para registrar en el log
    this.historialesService.getHistorial(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (historial) => {
        if (historial) {
          const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: 'Esta acción eliminará permanentemente el historial. No se puede deshacer.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
          });

          if (result.isConfirmed) {
            this.loadingService.show();
            try {
              await this.historialesService.eliminarHistorial(id);
              this.pacientesService.registrarEliminacionHistorialClinico(historial.paciente_id, historial).then(() => {}).catch(() => {});
              this.cargarHistoriales();
              this.cargarEstadisticas();
              this.loadingService.hide();
              setTimeout(() => Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El historial fue eliminado permanentemente.' }), 0);
            } catch (error) {
              this.loadingService.hide();
              setTimeout(() => Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el historial'
              }), 0);
            }
          }
        }
      });
  }

  async restaurarHistorial(id: string) {
    // Obtener los datos del historial antes de restaurarlo para registrar en el log
    this.historialesService.getHistorial(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (historial) => {
        if (historial) {
          const result = await Swal.fire({
            title: '¿Restaurar historial?',
            text: 'El historial será marcado como activo nuevamente.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, restaurar',
            cancelButtonText: 'Cancelar'
          });

          if (result.isConfirmed) {
            this.loadingService.show();
            try {
              await this.historialesService.restaurarHistorial(id);
              this.pacientesService.registrarHistorialClinico(historial.paciente_id, historial).then(() => {}).catch(() => {});
              this.cargarHistoriales();
              this.cargarEstadisticas();
              this.loadingService.hide();
              setTimeout(() => Swal.fire({ icon: 'success', title: 'Restaurado', text: 'El historial fue restaurado correctamente.' }), 0);
            } catch (error) {
              this.loadingService.hide();
              setTimeout(() => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo restaurar el historial' }), 0);
            }
          }
        }
      });
  }

  buscarHistoriales(texto: string) {
    if (texto.trim() === '') {
      this.cargarHistoriales();
      return;
    }

    this.historialesService.buscarHistoriales(texto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historiales) => {
          this.dataSource.data = historiales.map(historial => ({
            ...historial,
            paciente: this.pacientesMap[historial.paciente_id] || 'N/P',
            fecha_registro: this.formatearFecha(historial.fecha_registro)
          }));
        },
        error: (error) => {
          console.error('❌ Error en búsqueda:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error en Búsqueda',
            text: 'No se pudo realizar la búsqueda'
          });
        }
      });
  }
}
