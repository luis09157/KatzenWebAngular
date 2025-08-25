import { Component, OnInit, ViewChild } from '@angular/core';
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
import Swal from 'sweetalert2';
@Component({
  selector: 'app-historiales',
  templateUrl: './historiales.component.html',
  styleUrls: ['./historiales.component.css']
})
export class HistorialesComponent implements OnInit {
  displayedColumns: string[] = ['fecha_registro', 'paciente', 'diagnostico_presuntivo', 'manejo_terapeutico', 'medico_atendio', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  pacientesMap: { [id: string]: string } = {};
  estadisticas: any = { total: 0, activos: 0, inactivos: 0 };
  loading = false;
  necesitaMigracion = false;

  constructor(
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private migrationService: MigrationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.cargarDatos();
    this.cargarEstadisticas();
    this.verificarMigracion();
  }

  verificarMigracion() {
    this.migrationService.verificarHistorialesParaMigracion().subscribe(
      (necesita) => {
        this.necesitaMigracion = necesita;
        console.log('¿Necesita migración?', necesita);
      },
      (error) => {
        console.error('Error al verificar migración:', error);
      }
    );
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
        
      } catch (error) {
        console.error('Error en migración:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  cargarDatos() {
    this.pacientesService.getPacientes().subscribe(pacientes => {
      (pacientes || []).forEach(p => {
        this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
      });
      this.cargarHistoriales();
    });
  }

  cargarHistoriales() {
    this.historialesService.getHistorialesActivos().subscribe(historiales => {
      this.dataSource.data = (historiales || []).map(historial => ({
        ...historial,
        paciente: this.pacientesMap[historial.paciente_id] || 'N/P',
        fecha_registro: this.formatearFecha(historial.fecha_registro)
      }));
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      this.loading = false;
    });
  }

  cargarEstadisticas() {
    this.historialesService.getEstadisticasHistoriales().subscribe(stats => {
      this.estadisticas = stats;
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
      return 'N/P';
    }
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  abrirModalHistorial(historial: any = null, modoVer: boolean = false) {
    // Si es un nuevo historial (no hay historial existente), primero seleccionar cliente
    if (!historial && !modoVer) {
      this.seleccionarClienteParaHistorial();
      return;
    }

    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '700px',
      data: { historial, modoVer }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && !modoVer) {
        // Solo recargar datos, ya que el historial se maneja en el componente del diálogo
        this.cargarDatos();
      }
    });
  }

  seleccionarClienteParaHistorial() {
    const dialogRef = this.dialog.open(SeleccionarClienteDialogComponent, {
      width: '600px',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
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
      width: '700px',
      data: { historial: historialNuevo, modoVer: false }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // El historial ya se creó en el diálogo, solo recargar datos
        console.log('Historial creado exitosamente desde administración');
        this.cargarDatos();
      }
    });
  }

  editarHistorial(historial: any) {
    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      width: '700px',
      data: { historial, modoVer: false }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar el historial
        this.historialesService.actualizarHistorial(historial.id, result).then(() => {
          console.log('Historial actualizado exitosamente desde administración');
          
          // Registrar la edición en el log de actividades del paciente
          this.pacientesService.registrarEdicionHistorialClinico(historial.paciente_id, result).then(() => {
            console.log('Edición de historial registrada en log desde administración');
          }).catch(error => {
            console.error('Error al registrar edición en log:', error);
          });
          
          this.cargarDatos();
        }).catch(error => {
          console.error('Error al actualizar historial desde administración:', error);
          Swal.fire('Error', 'No se pudo actualizar el historial clínico', 'error');
        });
      }
    });
  }

  verHistorial(historial: any) {
    this.abrirModalHistorial(historial, true);
  }

  verHistorialDetalle(historial: any) {
    this.dialog.open(HistorialDetalleComponent, {
      width: '800px',
      data: historial
    });
  }

  bajaLogicaHistorial(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'El historial será dado de baja (baja lógica).',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, dar de baja',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        // Obtener los datos del historial antes de dar de baja para registrar en el log
        this.historialesService.getHistorial(id).subscribe(historial => {
          if (historial) {
            this.historialesService.bajaLogicaHistorial(id).then(() => {
              // Registrar la baja lógica en el log de actividades del paciente
              this.pacientesService.registrarEliminacionHistorialClinico(historial.paciente_id, historial).then(() => {
                console.log('Baja lógica de historial registrada en log desde administración');
              }).catch(error => {
                console.error('Error al registrar baja lógica en log:', error);
              });
              
              Swal.fire('Baja lógica', 'El historial fue dado de baja correctamente.', 'success');
              this.cargarDatos();
              this.cargarEstadisticas();
            }).catch(error => {
              console.error('Error al dar de baja:', error);
              Swal.fire('Error', 'No se pudo dar de baja el historial', 'error');
            });
          }
        });
      }
    });
  }

  eliminarHistorial(id: string) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción eliminará permanentemente el historial. No se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        // Obtener los datos del historial antes de eliminarlo para registrar en el log
        this.historialesService.getHistorial(id).subscribe(historial => {
          if (historial) {
            this.historialesService.eliminarHistorial(id).then(() => {
              // Registrar la eliminación en el log de actividades del paciente
              this.pacientesService.registrarEliminacionHistorialClinico(historial.paciente_id, historial).then(() => {
                console.log('Eliminación de historial registrada en log desde administración');
              }).catch(error => {
                console.error('Error al registrar eliminación en log:', error);
              });
              
              Swal.fire('Eliminado', 'El historial fue eliminado permanentemente.', 'success');
              this.cargarDatos();
              this.cargarEstadisticas();
            }).catch(error => {
              console.error('Error al eliminar:', error);
              Swal.fire('Error', 'No se pudo eliminar el historial', 'error');
            });
          }
        });
      }
    });
  }

  restaurarHistorial(id: string) {
    Swal.fire({
      title: '¿Restaurar historial?',
      text: 'El historial será marcado como activo nuevamente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        // Obtener los datos del historial antes de restaurarlo para registrar en el log
        this.historialesService.getHistorial(id).subscribe(historial => {
          if (historial) {
            this.historialesService.restaurarHistorial(id).then(() => {
              // Registrar la restauración en el log de actividades del paciente
              this.pacientesService.registrarHistorialClinico(historial.paciente_id, historial).then(() => {
                console.log('Restauración de historial registrada en log desde administración');
              }).catch(error => {
                console.error('Error al registrar restauración en log:', error);
              });
              
              Swal.fire('Restaurado', 'El historial fue restaurado correctamente.', 'success');
              this.cargarDatos();
              this.cargarEstadisticas();
            }).catch(error => {
              console.error('Error al restaurar:', error);
              Swal.fire('Error', 'No se pudo restaurar el historial', 'error');
            });
          }
        });
      }
    });
  }

  buscarHistoriales(texto: string) {
    if (texto.trim() === '') {
      this.cargarHistoriales();
      return;
    }

    this.historialesService.buscarHistoriales(texto).subscribe(historiales => {
      this.dataSource.data = historiales.map(historial => ({
        ...historial,
        paciente: this.pacientesMap[historial.paciente_id] || 'N/P',
        fecha_registro: this.formatearFecha(historial.fecha_registro)
      }));
    });
  }
}
