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
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { Banio } from '../shared/banio.model';
import { LoggerService } from '../core/logger.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import { exportToCsv } from '../core/utils/csv-export.util';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_DETAIL, ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { CajaMovimientoDialogComponent } from '../finanzas/caja-movimiento-dialog.component';
import {
  PeriodoPreset,
  fechaEnRango,
  formatMoneyMx,
  resolverPeriodo
} from '../core/utils/periodo-filtro.util';
import { VisitasService } from '../visitas/visitas.service';
import { VisitaDialogComponent } from '../visitas/visita-dialog.component';

@Component({
  selector: 'app-banios',
  templateUrl: './banios.component.html',
  styleUrls: ['./banios.component.css']
})
export class BaniosComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['fecha_banio', 'hora_banio', 'paciente', 'tipo_servicio', 'estado', 'peluquero', 'precio_total', 'acciones'];
  menuContext: any = null;
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
  private baniosActivos: Banio[] = [];
  /** Spec 025 — mes actual default; opcional semana. */
  periodoKpi: PeriodoPreset = 'este_mes';
  estadisticas = {
    totalHistorico: 0,
    delPeriodo: 0,
    programados: 0,
    en_proceso: 0,
    completados: 0,
    cancelados: 0,
    ingresosCobrados: 0,
    valorEstimado: 0,
    costosEstimados: 0,
    margenEstimado: 0,
    tamanoPequeno: 0,
    tamanoMediano: 0,
    tamanoGrande: 0,
    tamanoSinClasificar: 0
  };

  constructor(
    private baniosService: BaniosService,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private usuariosService: UsuariosService,
    private dialog: MatDialog,
    private logger: LoggerService,
    private loadingService: LoadingService,
    private errorMessages: ErrorMessagesService,
    private visitasService: VisitasService
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
    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: clientes => {
        (clientes || []).forEach((c: { id: string; nombre?: string; nombreCliente?: string }) => {
          this.clientesMap[c.id] = c.nombre || c.nombreCliente || 'N/P';
        });
        this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe({
          next: pacientes => {
            (pacientes || []).forEach((p: { id: string; nombre?: string }) => {
              this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
            });
            this.usuariosService.getUsuarios().pipe(takeUntil(this.destroy$)).subscribe({
              next: usuarios => {
                (usuarios || []).forEach((u: { id: string; nombre?: string }) => {
                  this.usuariosMap[u.id] = u.nombre ? u.nombre : 'N/P';
                });
                this.cargarBanios();
              },
              error: error => this.handleLoadError(error, () => this.cargarDatosIniciales())
            });
          },
          error: error => this.handleLoadError(error, () => this.cargarDatosIniciales())
        });
      },
      error: error => this.handleLoadError(error, () => this.cargarDatosIniciales())
    });
  }

  private handleLoadError(error: unknown, retry: () => void): void {
    this.logger.error('Error al cargar datos de baños:', error);
    this.loading = false;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: this.errorMessages.getUserMessage(error, 'cargar banios'),
      showCancelButton: true,
      confirmButtonText: 'Reintentar',
      cancelButtonText: 'Cerrar'
    }).then(result => {
      if (result.isConfirmed) {
        retry();
      }
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
            peluquero: banio.peluquero || this.usuariosMap[banio.peluquero_id] || 'N/P',
            fecha_banio: this.formatearFecha(banio.fecha_banio || banio.created_at),
            hora_banio: this.formatearHora(banio.hora_banio),
            tipo_servicio_texto: this.formatearTextoSeguro(banio.tipo_servicio),
            estado_texto: this.formatearTextoSeguro(banio.estado)
          }));
          this.baniosActivos = baniosActivos as Banio[];
          this.actualizarTablaSegura(nuevosDatos);
          this.calcularEstadisticas();
          this.loading = false;
        } catch (error) {
          this.logger.error('❌ Error al procesar datos de baños:', error);
          this.loading = false;
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar banios'), 'error');
        }
      },
      error: (error) => {
        this.logger.error('❌ Error al cargar baños:', error);
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: this.errorMessages.getUserMessage(error, 'cargar banios'),
          showCancelButton: true,
          confirmButtonText: 'Reintentar',
          cancelButtonText: 'Cerrar'
        }).then(result => {
          if (result.isConfirmed) {
            this.cargarBanios();
          }
        });
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

  setPeriodoKpi(preset: 'este_mes' | '30d'): void {
    this.periodoKpi = preset;
    this.calcularEstadisticas();
  }

  formatMoney(n: number): string {
    return formatMoneyMx(n, 0);
  }

  get periodoKpiLabel(): string {
    return resolverPeriodo(this.periodoKpi).label;
  }

  /**
   * Fuente primaria: campos del baño (`precio_total`, `pagado`, estado).
   * - Valor estimado / ingresos brutos: suma `precio_total` de no cancelados (aunque no haya caja).
   * - Ingresos cobrados: pagado o vinculado a caja.
   * - Ganancia (margen): ingresos brutos − costos del mismo set.
   *   Si costo === precio_venta → margen 0 (esperado); el ingreso bruto igual sube.
   */
  calcularEstadisticas(): void {
    const banios = this.baniosActivos || [];
    const rango = resolverPeriodo(this.periodoKpi);
    const delPeriodo = banios.filter((b) =>
      fechaEnRango(b.fecha_banio || b.created_at, rango)
    );
    const noCancel = delPeriodo.filter((b) => b.estado !== 'cancelado');

    this.estadisticas.totalHistorico = banios.length;
    this.estadisticas.delPeriodo = delPeriodo.length;
    this.estadisticas.programados = delPeriodo.filter((b) => b.estado === 'programado').length;
    this.estadisticas.en_proceso = delPeriodo.filter((b) => b.estado === 'en_proceso').length;
    this.estadisticas.completados = delPeriodo.filter((b) => b.estado === 'completado').length;
    this.estadisticas.cancelados = delPeriodo.filter((b) => b.estado === 'cancelado').length;

    this.estadisticas.valorEstimado = noCancel.reduce(
      (sum, b) => sum + (Number(b.precio_total) || 0),
      0
    );
    this.estadisticas.ingresosCobrados = noCancel
      .filter((b) => b.pagado || !!b.cajaMovimientoId)
      .reduce((sum, b) => sum + (Number(b.precio_total) || 0), 0);
    this.estadisticas.costosEstimados = noCancel.reduce((sum, b) => {
      if (b.costoEstimado == null || Number.isNaN(Number(b.costoEstimado))) return sum;
      return sum + Number(b.costoEstimado);
    }, 0);
    // Margen sobre valor de venta del período (no solo cobrados), para que
    // costo=venta → $0 sin ocultar que hubo ingreso bruto = valorEstimado.
    this.estadisticas.margenEstimado =
      this.estadisticas.valorEstimado - this.estadisticas.costosEstimados;

    const noCancelPeriodo = delPeriodo.filter((b) => b.estado !== 'cancelado');
    this.estadisticas.tamanoPequeno = noCancelPeriodo.filter(
      (b) => b.tamano_perro === 'pequeno'
    ).length;
    this.estadisticas.tamanoMediano = noCancelPeriodo.filter(
      (b) => b.tamano_perro === 'mediano'
    ).length;
    this.estadisticas.tamanoGrande = noCancelPeriodo.filter(
      (b) => b.tamano_perro === 'grande'
    ).length;
    this.estadisticas.tamanoSinClasificar = noCancelPeriodo.filter(
      (b) => !b.tamano_perro
    ).length;
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
        ...ADMIN_DIALOG_FORM,
        panelClass: ['admin-dialog-panel', 'banio-dialog-container'],
        data: banio
      });
      
      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result) {
          this.loadingService.hide();
          this.cargarBanios();
        }
      });
    } else {
      const dialogRef = this.dialog.open(BanioDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        panelClass: ['admin-dialog-panel', 'banio-dialog-container'],
        data: {}
      });

      dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
        if (result) {
          this.loadingService.hide();
          this.cargarBanios();
        }
      });
    }
  }

  verBanio(banio: any) {
    this.verDetalleBanio(banio);
  }

  editarBanio(banio: any) {
    const dialogRef = this.dialog.open(BanioDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      panelClass: ['admin-dialog-panel', 'banio-dialog-container'],
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
      title: '¿Borrar este baño?',
      text: `El baño de ${banio.paciente} se ocultará del listado. Los datos se conservan.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingService.show();
        this.baniosService.bajaLogicaBanio(banio.id)
          .then(() => {
            this.loadingService.hide();
            setTimeout(() => {
              Swal.fire('Borrado', 'El baño ha sido borrado correctamente', 'success');
              this.cargarBanios();
            }, 0);
          })
          .catch(error => {
            this.logger.error('Error al dar de baja baño:', error);
            this.loadingService.hide();
            setTimeout(() => Swal.fire('Error', this.errorMessages.getUserMessage(error, 'eliminar banio'), 'error'), 0);
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
        setTimeout(() => Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cambiar estado banio'), 'error'), 0);
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

  /** Spec 018: registrar cobro en caja y vincular cajaMovimientoId. */
  registrarEnCaja(banio: Banio): void {
    if (!banio?.id) return;
    if (banio.cajaMovimientoId) {
      Swal.fire({
        icon: 'info',
        title: 'Ya vinculado a caja',
        text: `Este baño ya tiene movimiento ${banio.cajaMovimientoId}. Evita doble cobro.`
      });
      return;
    }
    const metodo = (banio.metodo_pago || 'efectivo') as 'efectivo' | 'tarjeta' | 'transferencia';
    const tipoServ = String(banio.tipo_servicio || '').toLowerCase();
    const categoriaCaja =
      tipoServ.includes('corte') ? 'corte' as const : 'banio' as const;
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        fechaDefault: banio.fecha_banio || undefined,
        banioId: banio.id,
        concepto: `Baño · ${banio.paciente || 'paciente'} · ${banio.tipo_servicio || 'servicio'}`,
        monto: Number(banio.precio_total) || 0,
        metodoPago: metodo,
        notas: banio.observaciones || '',
        categoria: categoriaCaja,
        costoAsociado:
          banio.costoEstimado != null && !Number.isNaN(Number(banio.costoEstimado))
            ? Number(banio.costoEstimado)
            : undefined,
        plantillaCostoId: banio.plantillaCostoId || undefined
      }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(async (result) => {
      const movId = result?.movimientoId || (result?.ok && result?.movimientoId);
      if (!result || (!result.ok && !result.movimientoId)) return;
      const id = result.movimientoId as string | undefined;
      if (!id) return;
      this.loadingService.show(LOADING_MESSAGES.updating);
      try {
        await this.baniosService.actualizarBanio(banio.id!, {
          cajaMovimientoId: id,
          pagado: true,
          metodo_pago: metodo
        });
        this.cargarBanios();
      } catch (error) {
        this.logger.error('Error al vincular baño→caja:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'vincular baño a caja'), 'error');
      } finally {
        this.loadingService.hide();
      }
    });
  }

  /** Spec 032: baño sin cobro → ticket de visita. */
  async agregarAVisita(banio: Banio): Promise<void> {
    if (!banio?.id) return;
    if (banio.cajaMovimientoId || banio.pagado) {
      Swal.fire({
        icon: 'info',
        title: 'Ya cobrado',
        text: 'Este baño ya está pagado o vinculado a caja.'
      });
      return;
    }
    if ((banio as Banio & { visitaId?: string }).visitaId) {
      Swal.fire({
        icon: 'info',
        title: 'Ya en una visita',
        text: `Vinculado al ticket ${(banio as Banio & { visitaId?: string }).visitaId}.`
      });
      return;
    }
    const clienteId = banio.cliente_id || '';
    if (!clienteId) {
      Swal.fire('Falta cliente', 'El baño necesita cliente_id para el ticket.', 'warning');
      return;
    }
    const tipoServ = String(banio.tipo_servicio || '').toLowerCase();
    const categoria = tipoServ.includes('corte') ? 'corte' as const : 'banio' as const;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const { visitaId } = await this.visitasService.agregarServicioAVisita({
        cliente_id: clienteId,
        cliente: banio.cliente || this.clientesMap[clienteId] || '',
        paciente_id: banio.paciente_id,
        paciente: banio.paciente || '',
        descripcion: `Baño · ${banio.paciente || 'paciente'} · ${banio.tipo_servicio || 'servicio'}`,
        monto: Number(banio.precio_total) || 0,
        categoria,
        banioId: banio.id,
        fecha: banio.fecha_banio || undefined
      });
      await this.baniosService.actualizarBanio(banio.id, { visitaId });
      const visita = await this.visitasService.getVisita(visitaId);
      this.dialog.open(VisitaDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        data: { visita: visita || undefined }
      });
      Swal.fire({ icon: 'success', title: 'Agregado a visita', timer: 1400, showConfirmButton: false });
      this.cargarBanios();
    } catch (error) {
      this.logger.error('Error baño→visita:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'agregar a visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
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
      ...ADMIN_DIALOG_DETAIL,
      data: banio
    });

    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(() => {});
  }

  exportarCsv(): void {
    const rows = this.dataSource?.data || [];
    if (!rows.length) {
      Swal.fire('Sin datos', 'No hay baños para exportar.', 'info');
      return;
    }
    exportToCsv(`banios_${Date.now()}`, rows, [
      { header: 'Fecha', value: row => row.fecha_banio || '' },
      { header: 'Hora', value: row => row.hora_banio || '' },
      { header: 'Paciente', value: row => row.paciente || '' },
      { header: 'Tipo servicio', value: row => row.tipo_servicio || '' },
      { header: 'Estado', value: row => row.estado || '' },
      { header: 'Peluquero', value: row => row.peluquero || '' },
      { header: 'Precio', value: row => row.precio_total || 0 }
    ]);
  }
}
