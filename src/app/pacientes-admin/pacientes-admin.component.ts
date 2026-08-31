import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacienteAdminDialogComponent } from './paciente-admin-dialog.component';
import Swal from 'sweetalert2';
import { LoggerService } from '../core/logger.service';
import { LoadingService } from '../core/loading.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import { getClienteNombreCompleto } from '../core/utils/cliente-search.util';
import { getPacienteNombre } from '../core/utils/paciente-search.util';
import { normalizarTextoBusqueda, textoCoincide } from '../core/utils/text-search.util';

@Component({
  selector: 'app-pacientes-admin',
  templateUrl: './pacientes-admin.component.html',
  styleUrls: ['./pacientes-admin.component.css']
})
export class PacientesAdminComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  readonly pageSize = 50;

  displayedColumns: string[] = [
    'paciente',
    'dueno',
    'resumen',
    'estado',
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<any>([]);
  pacientes: any[] = [];
  clientes: any[] = [];
  loading = false;
  stats = {
    total: 0,
    duenosUnicos: 0,
    perros: 0,
    gatos: 0
  };
  pacienteMenuContext: any = null;

  constructor(
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private logger: LoggerService,
    private loadingService: LoadingService,
    private sucursalContext: SucursalContextService,
    private router: Router
  ) {}

  ngOnInit() {
    this.sucursalContext.selectedId$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (this.pacientes.length) {
        this.prepararDataSource();
      }
      this.cargarEstadisticas();
    });
    this.cargarDatos();
  }

  private cargarEstadisticas(): void {
    this.pacientesService
      .getEstadisticas(this.sucursalContext.getSelectedId())
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: stats => {
          this.stats = {
            total: stats.total,
            duenosUnicos: stats.duenosUnicos,
            perros: stats.perros,
            gatos: stats.gatos
          };
        },
        error: err => this.logger.error('Error al cargar estadísticas de pacientes:', err)
      });
  }

  ngAfterViewInit() {
    // Configurar paginador y ordenamiento después de que la vista esté lista
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }, 0);
  }

  cargarDatos() {
    this.loading = true;
    forkJoin({
      pacientes: this.pacientesService.getPacientes().pipe(take(1)),
      clientes: this.clientesService.getClientes().pipe(take(1))
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ pacientes, clientes }) => {
        this.pacientes = pacientes || [];
        this.clientes = clientes || [];
        this.prepararDataSource();
        this.cargarEstadisticas();
      },
      error: error => {
        this.logger.error('Error al cargar pacientes admin:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los pacientes.',
          showCancelButton: true,
          confirmButtonText: 'Reintentar',
          cancelButtonText: 'Cerrar'
        }).then(result => {
          if (result.isConfirmed) {
            this.cargarDatos();
          }
        });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }



  prepararDataSource() {
    // Misma regla que Buscar paciente: activo !== false (incluye legacy sin el campo).
    const pacientesActivos = this.pacientes.filter(p => p.activo !== false);
    
    const pacientesConCliente = pacientesActivos.map(paciente => {
      const pacienteConCliente = {
        ...paciente,
        nombre: getPacienteNombre(paciente) || paciente.nombre,
        nombreCliente: this.getClienteNombre(paciente.cliente_id || paciente.idCliente)
      };
      return pacienteConCliente;
    });
    
    this.dataSource.data = pacientesConCliente;
    this.dataSource.filterPredicate = (row: Record<string, unknown>, filter: string) => {
      const haystack = [
        row['nombre'],
        row['Nombre'],
        row['especie'],
        row['raza'],
        row['nombreCliente'],
        row['sexo']
      ]
        .filter(Boolean)
        .join(' ');
      return textoCoincide(haystack, filter);
    };

    
    // Configurar paginador y ordenamiento de forma segura
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.sort) {
        this.dataSource.sort = this.sort;
      }
    }, 0);
    
    this.loading = false;
  }

  getClienteNombre(idCliente: string): string {
    if (!idCliente) return 'Sin dueño';
    const cliente = this.clientes.find(c => c.id === idCliente);
    if (!cliente) return 'Cliente no encontrado';
    return getClienteNombreCompleto(cliente) || 'Sin dueño';
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = normalizarTextoBusqueda(filterValue);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  abrirExpediente(paciente: { id?: string }): void {
    if (!paciente?.id) {
      return;
    }
    this.router.navigate(['/admin/paciente'], { queryParams: { id: paciente.id } });
  }

  nuevoPaciente() {
    const dialogRef = this.dialog.open(PacienteAdminDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.pacientesService.crearPaciente(result)
          .then((id) => {
            this.loadingService.hide();
            const nuevo = { ...result, id, activo: true };
            this.pacientes = [nuevo, ...this.pacientes.filter(p => p.id !== id)];
            this.prepararDataSource();
            setTimeout(() => {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Paciente creado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
            }, 0);
          })
          .catch(error => {
            this.logger.error('Error al crear paciente:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', 'No se pudo crear el paciente', 'error'), 0);
          });
      }
    });
  }

  editarPaciente(paciente: any) {
    const dialogRef = this.dialog.open(PacienteAdminDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      data: { paciente, modo: 'editar' }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.pacientesService.actualizarPaciente(paciente.id, result)
          .then(() => {
            this.loadingService.hide();
            this.pacientes = this.pacientes.map(p =>
              p.id === paciente.id ? { ...p, ...result, id: paciente.id } : p
            );
            this.prepararDataSource();
            setTimeout(() => {
              Swal.fire({
                icon: 'success',
                title: 'Éxito',
                text: 'Paciente actualizado correctamente',
                timer: 2000,
                showConfirmButton: false
              });
            }, 0);
          })
          .catch(error => {
            this.logger.error('❌ Error al actualizar paciente:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', 'No se pudo actualizar el paciente', 'error'), 0);
          });
      }
    });
  }

  eliminarPaciente(paciente: any) {
    Swal.fire({
      title: '¿Borrar este paciente?',
      text: `El paciente "${paciente.nombre}" se ocultará del listado. Los datos se conservan y puede reactivarse desde la app staff.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingService.show();
        this.pacientesService.bajaLogicaPaciente(paciente.id)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Borrado', 'Paciente borrado correctamente.', 'success');
              this.cargarDatos();
            }, 0);
          })
          .catch(error => {
            this.logger.error('Error al eliminar paciente:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', 'No se pudo borrar el paciente', 'error'), 0);
          });
      }
    });
  }

  verPaciente(paciente: any) {
    this.abrirExpediente(paciente);
  }

  calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return 'N/P';
    
    try {
      const partes = fechaNacimiento.split('/');
      if (partes.length !== 3) {
        return 'N/P';
      }
      
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]) - 1;
      const año = parseInt(partes[2]);
      
      const fechaNac = new Date(año, mes, dia);
      const hoy = new Date();
      
      if (isNaN(fechaNac.getTime())) {
        return 'N/P';
      }
      
      const diferencia = hoy.getTime() - fechaNac.getTime();
      const años = Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365));
      const meses = Math.floor((diferencia % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
      
      if (años > 0) {
        return `${años} año${años > 1 ? 's' : ''} y ${meses} mes${meses > 1 ? 'es' : ''}`;
      } else {
        return `${meses} mes${meses > 1 ? 'es' : ''}`;
      }
    } catch (error) {
      return 'N/P';
    }
  }

  // Métodos para estadísticas (totales globales en RTDB, no solo la página visible)
} 