import { Component, OnInit, ViewChild } from '@angular/core';
import { CitasService } from './citas.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { MatDialog } from '@angular/material/dialog';
import { CitaDialogComponent } from './cita-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent implements OnInit {
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
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.clientesService.getClientes().subscribe(clientes => {
      (clientes || []).forEach(c => {
        this.clientesMap[c.id] = c.nombre ? c.nombre + (c.apellidoPaterno ? ' ' + c.apellidoPaterno : '') : 'N/P';
      });
      this.pacientesService.getPacientes().subscribe(pacientes => {
        (pacientes || []).forEach(p => {
          this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
        });
        this.citasService.getCitas().subscribe(citas => {
          const citasInactivas = citas?.filter(c => c.activo === false) || [];
          console.log('📋 Citas obtenidas de Firebase:', citas?.length || 0);
          console.log('📋 Citas con activo=false:', citasInactivas.length);
          
          // Debug: Mostrar las primeras citas para ver qué campos tienen
          if (citas && citas.length > 0) {
            console.log('🔍 Primera cita de ejemplo:', citas[0]);
            console.log('🔍 Campos de fecha disponibles:', {
              fecha: citas[0].fecha,
              fecha_hora: citas[0].fecha_hora,
              hora: citas[0].hora
            });
          }
          
          // Solo mostrar detalles de citas excluidas si hay pocas (menos de 5)
          if (citasInactivas.length > 0 && citasInactivas.length <= 5) {
            citasInactivas.forEach(c => {
              console.log('🚫 Cita excluida (activo=false):', c.id, c.fecha_hora);
            });
          } else if (citasInactivas.length > 5) {
            console.log(`🚫 ${citasInactivas.length} citas excluidas (activo=false) - demasiadas para mostrar individualmente`);
          }
          
          // Filtrar citas activas, mapear datos y ordenar por fecha (más recientes primero)
          this.dataSource.data = (citas || [])
            .filter(c => c.activo !== false)
            .map(cita => ({
              ...cita,
              cliente: this.clientesMap[cita.cliente_id] || 'N/P',
              paciente: this.pacientesMap[cita.paciente_id] || 'N/P'
            }))
            .sort((a, b) => {
              // Primero ordenar por estado (pendientes primero)
              const estadoA = (a.estado || '').toLowerCase();
              const estadoB = (b.estado || '').toLowerCase();
              
              // Prioridad de estados: pendiente > confirmada > completada > cancelada
              const prioridadEstados = {
                'pendiente': 4,
                'confirmada': 3,
                'completada': 2,
                'cancelada': 1
              };
              
              const prioridadA = prioridadEstados[estadoA] || 0;
              const prioridadB = prioridadEstados[estadoB] || 0;
              
              if (prioridadA !== prioridadB) {
                return prioridadB - prioridadA; // Mayor prioridad primero
              }
              
              // Si tienen el mismo estado, ordenar por fecha (más reciente primero)
              const fechaA = new Date(a.fecha || a.fecha_hora || 0);
              const fechaB = new Date(b.fecha || b.fecha_hora || 0);
              return fechaA.getTime() - fechaB.getTime(); // Ordenar por fecha ascendente (más antigua primero)
            });
          
          console.log('✅ Citas activas después del filtro:', this.dataSource.data.length);
          
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
        console.error('❌ Error procesando fecha:', error);
      }
    }
    
    // Fallback a fecha_hora solo si no hay fecha
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
        console.error('❌ Error procesando fecha_hora:', error);
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
    console.log('🔄 Cambiando estado de cita:', cita.id, 'de', cita.estado, 'a', nuevoEstado);
    
    const citaActualizada = { 
      ...cita, 
      estado: nuevoEstado,
      fecha_actualizacion: new Date().toISOString() // Agregar timestamp de actualización
    };
    
    this.citasService.guardarCita(citaActualizada).then(() => {
      console.log('✅ Estado cambiado exitosamente');
      Swal.fire({
        title: '¡Éxito!',
        text: `Cita marcada como ${nuevoEstado.toUpperCase()}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
      this.ngOnInit(); // Recargar datos
    }).catch(error => {
      console.error('❌ Error al cambiar estado:', error);
      Swal.fire({
        title: 'Error',
        text: 'No se pudo cambiar el estado de la cita',
        icon: 'error'
      });
    });
  }

  abrirModalCita(cita: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(CitaDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: { cita, modoVer }
    });
    dialogRef.afterClosed().subscribe(result => {
      console.log('🔍 Resultado del diálogo:', result);
      console.log('🔍 Modo ver:', modoVer);
      
      if (result && !modoVer) {
        console.log('✅ Procesando resultado del diálogo...');
        console.log('📝 Datos de la cita a guardar:', result);
        
        this.citasService.guardarCita(result).then(() => {
          console.log('✅ Cita guardada exitosamente en Firebase');
          Swal.fire({
            title: '¡Éxito!',
            text: 'Cita guardada correctamente',
            icon: 'success',
            confirmButtonText: 'Entendido'
          });
          this.ngOnInit(); // Recargar datos
        }).catch(error => {
          console.error('❌ Error al guardar cita:', error);
          console.error('❌ Detalles del error:', error.message);
          
          // Mostrar error específico al usuario
          let mensajeError = 'No se pudo guardar la cita';
          if (error.message) {
            mensajeError = error.message;
          }
          
          Swal.fire({
            title: 'Error al guardar cita',
            text: mensajeError,
            icon: 'error',
            confirmButtonText: 'Entendido'
          });
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
    console.log('🗑️ === INICIO ELIMINACIÓN CITA ===');
    console.log('🗑️ ID recibido:', id);
    console.log('🗑️ Tipo de ID:', typeof id);
    console.log('🗑️ ID es válido:', id && id.length > 0);
    
    // Buscar la cita en el dataSource para obtener más información
    const cita = this.dataSource.data.find(c => c.id === id);
    console.log('🗑️ Cita encontrada:', cita);
    
    if (!id || id.length === 0) {
      console.error('❌ ERROR: ID de cita inválido:', id);
      Swal.fire({
        title: 'Error',
        text: 'ID de cita inválido. No se puede eliminar.',
        icon: 'error'
      });
      return;
    }
    
    if (!cita) {
      console.error('❌ ERROR: Cita no encontrada en dataSource con ID:', id);
      Swal.fire({
        title: 'Error',
        text: 'Cita no encontrada. No se puede eliminar.',
        icon: 'error'
      });
      return;
    }
    
    console.log('🗑️ Iniciando proceso de eliminación para cita ID:', id);
    console.log('🗑️ Datos de la cita:', {
      id: cita.id,
      fecha_hora: cita.fecha_hora,
      cliente: cita.cliente,
      paciente: cita.paciente,
      estado: cita.estado,
      activo: cita.activo
    });
    
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
        console.log('✅ Usuario confirmó eliminación de cita ID:', id);
        
        this.citasService.bajaLogicaCita(id).then(() => {
          console.log('✅ Cita eliminada exitosamente en Firebase');
          Swal.fire({
            title: '¡Eliminado!',
            text: 'Cita eliminada correctamente',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.ngOnInit(); // Recargar datos
        }).catch(error => {
          console.error('❌ Error al eliminar cita:', error);
          Swal.fire({
            title: 'Error',
            text: 'No se pudo eliminar la cita. Inténtalo de nuevo.',
            icon: 'error'
          });
        });
      } else {
        console.log('❌ Usuario canceló la eliminación de cita ID:', id);
      }
    });
  }
}
