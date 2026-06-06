import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, take } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacienteAdminDialogComponent } from './paciente-admin-dialog.component';
import Swal from 'sweetalert2';
import { LoggerService } from '../core/logger.service';
import { LoadingService } from '../core/loading.service';

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
    'nombre', 
    'especie', 
    'raza', 
    'sexo', 
    'estado',
    'edad', 
    'color', 
    'peso', 
    'nombreCliente', 
    'acciones'
  ];
  
  dataSource = new MatTableDataSource<any>([]);
  pacientes: any[] = [];
  clientes: any[] = [];
  loading = false;

  constructor(
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.cargarDatos();
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
    // Filtrar solo pacientes activos
    const pacientesActivos = this.pacientes.filter(p => p.activo !== false);
    
    // Combinar datos de pacientes con nombres de clientes
    const pacientesConCliente = pacientesActivos.map(paciente => {
      const pacienteConCliente = {
        ...paciente,
        nombreCliente: this.getClienteNombre(paciente.cliente_id || paciente.idCliente)
      };
      return pacienteConCliente;
    });
    
    // Actualizar el dataSource existente en lugar de crear uno nuevo
    this.dataSource.data = pacientesConCliente;
    
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
    return [cliente.nombre, cliente.apellidoPaterno, cliente.apellidoMaterno].filter(Boolean).join(' ');
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  nuevoPaciente() {
    const dialogRef = this.dialog.open(PacienteAdminDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { modo: 'crear' }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.pacientesService.crearPaciente(result)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Éxito', 'Paciente creado correctamente', 'success');
              this.cargarDatos();
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
      width: '90vw',
      maxWidth: '95vw',
      data: { paciente, modo: 'editar' }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.pacientesService.actualizarPaciente(paciente.id, result)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Éxito', 'Paciente actualizado correctamente', 'success');
              this.cargarDatos();
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
      title: '¿Dar de baja?',
      text: `El paciente "${paciente.nombre}" se marcará como inactivo. Los datos se conservan y puede reactivarse desde la app staff.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingService.show();
        this.pacientesService.bajaLogicaPaciente(paciente.id)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Baja lógica', 'Paciente dado de baja correctamente.', 'success');
              this.cargarDatos();
            }, 0);
          })
          .catch(error => {
            this.logger.error('Error al eliminar paciente:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', 'No se pudo eliminar el paciente', 'error'), 0);
          });
      }
    });
  }

  verPaciente(paciente: any) {
    const dialogRef = this.dialog.open(PacienteAdminDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { paciente, modo: 'ver' }
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadingService.show();
        this.pacientesService.actualizarPaciente(paciente.id, result)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Éxito', 'Paciente actualizado correctamente', 'success');
              this.cargarDatos();
            }, 0);
          })
          .catch(error => {
            this.logger.error('❌ Error al actualizar paciente desde modo "ver":', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', 'No se pudo actualizar el paciente', 'error'), 0);
          });
      }
    });
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

  // Métodos para estadísticas
  getUniqueOwners(): number {
    const owners = this.dataSource.data.map(p => p.cliente_id || p.idCliente).filter(Boolean);
    return new Set(owners).size;
  }

  getDogsCount(): number {
    return this.dataSource.data.filter(p => 
      p.especie && p.especie.toLowerCase().includes('perro') || 
      p.especie && p.especie.toLowerCase().includes('canino') ||
      p.especie && p.especie.toLowerCase().includes('dog')
    ).length;
  }

  getCatsCount(): number {
    return this.dataSource.data.filter(p => 
      p.especie && p.especie.toLowerCase().includes('gato') || 
      p.especie && p.especie.toLowerCase().includes('felino') ||
      p.especie && p.especie.toLowerCase().includes('cat')
    ).length;
  }
} 