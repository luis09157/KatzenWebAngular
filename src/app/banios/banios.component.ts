import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BaniosService } from './banios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { MatDialog } from '@angular/material/dialog';
import { BanioDialogComponent } from './banio-dialog.component';
import { BanioDetalleComponent } from './banio-detalle.component';
import { SeleccionarClienteBanioDialogComponent } from './seleccionar-cliente-banio-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Banio } from '../shared/banio.model';
import { LoggerService } from '../core/logger.service';
import { LoadingService } from '../core/loading.service';

@Component({
  selector: 'app-banios',
  templateUrl: './banios.component.html',
  styleUrls: ['./banios.component.css']
})
export class BaniosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['fecha_banio', 'hora_banio', 'paciente', 'tipo_servicio', 'estado', 'peluquero', 'precio_total', 'acciones'];
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;
  // Mapeos para nombres
  pacientesMap: { [id: string]: string } = {};
  clientesMap: { [id: string]: string } = {};
  usuariosMap: { [id: string]: string } = {};
  
  // Propiedades para estadísticas y loading
  loading = false;
  tablaInicializada = false;
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
    private clientesService: ClientesService,
    private usuariosService: UsuariosService,
    private dialog: MatDialog,
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    // No cargar datos aquí, esperar a que la vista esté lista
    // Definir un filtro explícito para evitar resultados parciales inesperados
    this.dataSource.filterPredicate = (data: any, filter: string) => {
      const texto = (filter || '').trim().toLowerCase();
      if (!texto) { return true; }
      const campos = [
        data.paciente,
        data.cliente,
        data.tipo_servicio,
        data.estado,
        data.peluquero,
        data.fecha_banio,
        data.hora_banio
      ];
      return campos.some(v => (v || '').toString().toLowerCase().includes(texto));
    };
  }

  ngAfterViewInit(): void {
    // Configurar el paginador después de que la vista esté inicializada
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    
    // Esperar un ciclo completo antes de cargar los datos
    // Esto evita los errores de onDestroy de Angular Material
    setTimeout(() => {
      this.cargarDatosIniciales();
    }, 100);
  }

  cargarDatosIniciales() {
    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe(clientes => {
      (clientes || []).forEach((c: { id: string; nombre?: string; nombreCliente?: string }) => {
        this.clientesMap[c.id] = c.nombre || c.nombreCliente || 'N/P';
      });
      this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe(pacientes => {
        (pacientes || []).forEach((p: { id: string; nombre?: string }) => {
          this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
        });
        this.usuariosService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe(usuarios => {
          (usuarios || []).forEach((u: { id: string; nombre?: string }) => {
            this.usuariosMap[u.id] = u.nombre ? u.nombre : 'N/P';
          });
          this.cargarBanios();
        });
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarBanios() {
    this.loading = true;
    this.baniosService.getBanios().pipe(takeUntil(this.destroy$)).subscribe({
      next: (banios) => {
        try {
          const baniosActivos = (banios || []).filter((b: { activo?: boolean }) => b.activo !== false);
          const nuevosDatos = baniosActivos.map((banio: any) => ({
            ...banio,
            paciente: this.pacientesMap[banio.paciente_id] || 'N/P',
            cliente: this.clientesMap[banio.cliente_id] || 'N/P',
            peluquero: this.usuariosMap[banio.peluquero_id] || 'N/P',
            fecha_banio: this.formatearFecha(banio.fecha_banio || banio.created_at),
            hora_banio: this.formatearHora(banio.hora_banio),
            tipo_servicio_texto: this.formatearTextoSeguro(banio.tipo_servicio),
            estado_texto: this.formatearTextoSeguro(banio.estado)
          }));
          this.actualizarTablaSegura(nuevosDatos);
          this.calcularEstadisticas(baniosActivos);
          this.loading = false;
        } catch (error) {
          this.logger.error('❌ Error al procesar datos de baños:', error);
          this.loading = false;
        }
      },
      error: (error) => {
        this.logger.error('❌ Error al cargar baños:', error);
        this.loading = false;
      }
    });
  }

  private actualizarTablaSegura(nuevosDatos: any[]) {
    try {
      this.dataSource.data = [...nuevosDatos];
      this.dataSource.filter = '';
      if (this.paginator && this.dataSource.paginator !== this.paginator) {
        this.dataSource.paginator = this.paginator;
      }
      if (this.paginator) {
        this.paginator.firstPage();
      }
      this.tablaInicializada = true;
    } catch (error) {
      this.logger.error('❌ Error al actualizar tabla:', error);
      this.dataSource.data = nuevosDatos;
      this.tablaInicializada = true;
    }
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
        // Intentar ISO o 'YYYY-MM-DD HH:mm:ss'
        let date = new Date(fecha);
        if (isNaN(date.getTime())) {
          const onlyDate = fecha.split(' ')[0];
          const m = onlyDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (m) {
            date = new Date(parseInt(m[1],10), parseInt(m[2],10)-1, parseInt(m[3],10));
          }
        }
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

  // Evitar pipes personalizados inexistentes en template, normalizar texto
  private formatearTextoSeguro(valor: any): string {
    try {
      const texto = (valor || '').toString();
      // Reemplazar guiones bajos por espacios y capitalizar palabras
      const limpio = texto.replace(/_/g, ' ');
      return limpio.charAt(0).toUpperCase() + limpio.slice(1);
    } catch {
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
        width: '95vw',
        minWidth: '900px',
        maxWidth: '100vw',
        panelClass: 'banio-dialog-container',
        data: banio
      });
      
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result) {
          this.loadingService.hide();
          this.cargarBanios();
        }
      });
    } else {
      this.seleccionarClienteParaBanio();
    }
  }

  seleccionarClienteParaBanio() {
    const dialogRef = this.dialog.open(SeleccionarClienteBanioDialogComponent, {
      width: '95vw',
      minWidth: '800px',
      maxWidth: '100vw',
      disableClose: true,
      panelClass: 'seleccionar-cliente-banio-dialog-container'
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
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
      width: '95vw',
      minWidth: '900px',
      maxWidth: '100vw',
      panelClass: 'banio-dialog-container',
      data: banioNuevo
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result) {
        this.loadingService.hide();
        this.cargarBanios();
      }
    });
  }

  verBanio(banio: any) {}

  editarBanio(banio: any) {
    const dialogRef = this.dialog.open(BanioDialogComponent, {
      width: '90vw',
      maxWidth: '95vw',
      panelClass: 'banio-dialog-container',
      data: banio
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result === true) {
        this.loadingService.hide();
        this.cargarBanios();
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
        this.loadingService.show();
        this.baniosService.eliminarBanio(banio.id)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Eliminado', 'El baño ha sido eliminado exitosamente', 'success');
              this.cargarBanios();
            }, 0);
          })
          .catch(error => {
            this.logger.error('Error al eliminar baño:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', 'No se pudo eliminar el baño', 'error'), 0);
          });
      }
    });
  }

  cambiarEstado(banio: any, nuevoEstado: string) {
    this.loadingService.show();
    this.baniosService.cambiarEstadoBanio(banio.id, nuevoEstado as any)
      .then(() => {
        this.loadingService.hide();
        setTimeout(() => {
          Swal.fire('Estado actualizado', 'El estado del baño ha sido actualizado', 'success');
          this.cargarBanios();
        }, 0);
      })
      .catch(error => {
        this.logger.error('Error al cambiar estado:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire('Error', 'No se pudo actualizar el estado', 'error'), 0);
      });
  }

  marcarComoPagado(banio: any) {
    this.loadingService.show();
    this.baniosService.marcarComoPagado(banio.id)
      .then(() => {
        this.loadingService.hide();
        setTimeout(() => {
          Swal.fire('Pagado', 'El baño ha sido marcado como pagado', 'success');
          this.cargarBanios();
        }, 0);
      })
      .catch(error => {
        this.logger.error('Error al marcar como pagado:', error);
        this.loadingService.hide();
        setTimeout(() => Swal.fire('Error', 'No se pudo marcar como pagado', 'error'), 0);
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

  verDetalleBanio(banio: any) {
    const dialogRef = this.dialog.open(BanioDetalleComponent, {
      width: '90vw',
      maxWidth: '95vw',
      data: banio
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {});
  }
}
