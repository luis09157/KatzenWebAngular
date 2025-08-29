import { Component, OnInit, ViewChild } from '@angular/core';
import { BaniosService } from './banios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { MatDialog } from '@angular/material/dialog';
import { BanioDialogComponent } from './banio-dialog.component';
import { SeleccionarClienteBanioDialogComponent } from './seleccionar-cliente-banio-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Banio } from '../shared/banio.model';

@Component({
  selector: 'app-banios',
  templateUrl: './banios.component.html',
  styleUrls: ['./banios.component.css']
})
export class BaniosComponent implements OnInit {
  displayedColumns: string[] = ['fecha_banio', 'hora_banio', 'paciente', 'tipo_servicio', 'estado', 'peluquero', 'precio_total', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  
  // Mapeos para nombres
  pacientesMap: { [id: string]: string } = {};
  clientesMap: { [id: string]: string } = {};
  usuariosMap: { [id: string]: string } = {};
  
  // Propiedades para estadísticas y loading
  loading = false;
  estadisticas = {
    total: 0,
    programados: 0,
    en_proceso: 0,
    completados: 0,
    ingresos_totales: 0
  };

  constructor(
    private baniosService: BaniosService,
    private pacientesService: PacientesService,
    private usuariosService: UsuariosService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales() {
    // Cargar pacientes
    this.pacientesService.getPacientes().subscribe(pacientes => {
      (pacientes || []).forEach(p => {
        this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
      });
    });

    // Cargar usuarios (peluqueros)
    this.usuariosService.getUsuarios().subscribe(usuarios => {
      (usuarios || []).forEach(u => {
        this.usuariosMap[u.id] = u.nombre ? u.nombre : 'N/P';
      });
    });

    // Cargar baños
    this.cargarBanios();
  }

  cargarBanios() {
    this.loading = true;
    this.baniosService.getBanios().subscribe(banios => {
      const baniosActivos = (banios || []).filter(b => b.activo !== false);
      
      this.dataSource.data = baniosActivos.map(banio => ({
        ...banio,
        paciente: this.pacientesMap[banio.paciente_id] || 'N/P',
        cliente: this.clientesMap[banio.cliente_id] || 'N/P',
        peluquero: this.usuariosMap[banio.peluquero_id] || 'N/P',
        fecha_banio: this.formatearFecha(banio.fecha_banio),
        hora_banio: this.formatearHora(banio.hora_banio)
      }));
      
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      
      this.calcularEstadisticas(baniosActivos);
      this.loading = false;
    }, error => {
      console.error('Error al cargar baños:', error);
      this.loading = false;
    });
  }

  calcularEstadisticas(banios: Banio[]) {
    this.estadisticas.total = banios.length;
    this.estadisticas.programados = banios.filter(b => b.estado === 'programado').length;
    this.estadisticas.en_proceso = banios.filter(b => b.estado === 'en_proceso').length;
    this.estadisticas.completados = banios.filter(b => b.estado === 'completado').length;
    
    this.estadisticas.ingresos_totales = banios
      .filter(b => b.pagado)
      .reduce((sum, b) => sum + (b.precio_total || 0), 0);
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

  formatearHora(hora: any): string {
    if (!hora) return 'N/P';
    
    try {
      if (typeof hora === 'string') {
        // Si es formato 24h, convertirlo a 12h
        const [horas, minutos] = hora.split(':');
        const horaNum = parseInt(horas);
        const ampm = horaNum >= 12 ? 'PM' : 'AM';
        const hora12 = horaNum % 12 || 12;
        return `${hora12}:${minutos} ${ampm}`;
      }
      return hora.toString();
    } catch (error) {
      return 'N/P';
    }
  }

  aplicarFiltro(event: Event) {
    const filtro = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filtro.trim().toLowerCase();
  }

  abrirModalBanio(banio: any = null) {
    // Si es un baño existente (edición), abrir directamente
    if (banio && banio.id) {
      const dialogRef = this.dialog.open(BanioDialogComponent, {
        width: '700px',
        minWidth: '600px',
        maxWidth: '90vw',
        panelClass: 'banio-dialog-container',
        data: banio
      });
      
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.cargarBanios();
        }
      });
    } else {
      // Si es nuevo, primero seleccionar cliente y paciente
      this.seleccionarClienteParaBanio();
    }
  }

  seleccionarClienteParaBanio() {
    const dialogRef = this.dialog.open(SeleccionarClienteBanioDialogComponent, {
      width: '600px',
      disableClose: true,
      panelClass: 'seleccionar-cliente-banio-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.cliente_id && result.paciente_id) {
        this.abrirModalBanioConPaciente(result);
      }
    });
  }

  abrirModalBanioConPaciente(datosPaciente: any) {
    const banioNuevo = {
      paciente_id: datosPaciente.paciente_id,
      paciente: datosPaciente.paciente,
      cliente_id: datosPaciente.cliente_id,
      cliente: datosPaciente.cliente
    };

    const dialogRef = this.dialog.open(BanioDialogComponent, {
      width: '700px',
      minWidth: '600px',
      maxWidth: '90vw',
      panelClass: 'banio-dialog-container',
      data: banioNuevo
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ Baño creado exitosamente desde administración');
        this.cargarBanios();
      }
    });
  }

  verBanio(banio: any) {
    // Aquí puedes abrir un modal de detalle o navegar a una página de detalle
    console.log('Ver baño:', banio);
  }

  editarBanio(banio: any) {
    const dialogRef = this.dialog.open(BanioDialogComponent, {
      width: '700px',
      minWidth: '600px',
      maxWidth: '90vw',
      panelClass: 'banio-dialog-container',
      data: banio
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Actualizar el baño
        this.baniosService.actualizarBanio(banio.id, result).then(() => {
          console.log('✅ Baño actualizado exitosamente desde administración');
          this.cargarBanios();
        }).catch(error => {
          console.error('❌ Error al actualizar baño desde administración:', error);
          Swal.fire('Error', 'No se pudo actualizar el baño', 'error');
        });
      }
    });
  }

  eliminarBanio(banio: any) {
    Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Deseas eliminar el baño de ${banio.paciente}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loading = true;
        this.baniosService.eliminarBanio(banio.id)
          .then(() => {
                    Swal.fire('Eliminado', 'El baño ha sido eliminado exitosamente', 'success');
        this.cargarBanios();
          })
          .catch(error => {
            console.error('Error al eliminar baño:', error);
            Swal.fire('Error', 'No se pudo eliminar el baño', 'error');
            this.loading = false;
          });
      }
    });
  }

  cambiarEstado(banio: any, nuevoEstado: string) {
    this.baniosService.cambiarEstadoBanio(banio.id, nuevoEstado as any)
      .then(() => {
        Swal.fire('Estado actualizado', 'El estado del baño ha sido actualizado', 'success');
        this.cargarBanios();
      })
      .catch(error => {
        console.error('Error al cambiar estado:', error);
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
      });
  }

  marcarComoPagado(banio: any) {
    this.baniosService.marcarComoPagado(banio.id)
      .then(() => {
        Swal.fire('Pagado', 'El baño ha sido marcado como pagado', 'success');
        this.cargarBanios();
      })
      .catch(error => {
        console.error('Error al marcar como pagado:', error);
        Swal.fire('Error', 'No se pudo marcar como pagado', 'error');
      });
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'programado': return '#2196f3'; // Azul
      case 'en_proceso': return '#ff9800'; // Naranja
      case 'completado': return '#4caf50'; // Verde
      case 'cancelado': return '#f44336'; // Rojo
      default: return '#9e9e9e'; // Gris
    }
  }

  getTipoServicioIcon(tipo: string): string {
    switch (tipo) {
      case 'baño_básico': return 'shower';
      case 'baño_completo': return 'spa';
      case 'corte_pelo': return 'content_cut';
      case 'corte_uñas': return 'scissors';
      case 'deslanado': return 'brush';
      case 'tratamiento_especial': return 'healing';
      default: return 'pets';
    }
  }
}
