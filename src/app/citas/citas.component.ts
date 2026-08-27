import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { LOADING_MESSAGES, LoadingService } from '../core/loading.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { filterBySucursal } from '../core/utils/sucursal-filter.util';
import { CajaMovimientoDialogComponent } from '../finanzas/caja-movimiento-dialog.component';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { staffRoleIsVeterinarioOperativo } from '../core/config/staff-role.config';
import { VisitasService } from '../visitas/visitas.service';
import { VisitaDialogComponent } from '../visitas/visita-dialog.component';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';

@Component({
  selector: 'app-citas',
  templateUrl: './citas.component.html',
  styleUrls: ['./citas.component.css']
})
export class CitasComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['fecha_hora', 'consulta', 'motivo', 'estado', 'veterinario', 'acciones'];
  menuContext: any = null;
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  readonly pageSize = 50;
  clientesMap: { [id: string]: string } = {};
  pacientesMap: { [id: string]: string } = {};
  loading = false;
  /** doctor | administrador pueden revertir completada → confirmada */
  puedeRevertirCompletada = false;

  constructor(
    private citasService: CitasService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private loadingService: LoadingService,
    private sucursalContext: SucursalContextService,
    private authProfile: AuthProfileService,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    this.authProfile.getEffectiveStaffRole().then(role => {
      this.puedeRevertirCompletada = staffRoleIsVeterinarioOperativo(role);
    }).catch(() => {
      this.puedeRevertirCompletada = false;
    });
    this.sucursalContext.selectedId$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.cargarCitas();
    });
    this.cargarCitas();
  }

  private cargarCitas(): void {
    this.loading = true;
    this.clientesService.getClientes().pipe(takeUntil(this.destroy$)).subscribe({
      next: clientes => {
        (clientes || []).forEach((c: { id: string; nombre?: string; apellidoPaterno?: string }) => {
          this.clientesMap[c.id] = c.nombre ? c.nombre + (c.apellidoPaterno ? ' ' + c.apellidoPaterno : '') : 'N/P';
        });
        this.pacientesService.getPacientes().pipe(takeUntil(this.destroy$)).subscribe({
          next: pacientes => {
            (pacientes || []).forEach((p: { id: string; nombre?: string }) => {
              this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
            });
            this.citasService.getCitas().pipe(takeUntil(this.destroy$)).subscribe({
              next: citas => {
                const citasFiltradas = filterBySucursal(citas || [], this.sucursalContext.getSelectedId());
                this.dataSource.data = citasFiltradas
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
                if (this.sort) {
                  this.dataSource.sort = this.sort;
                  this.sort.sort({
                    id: 'fecha_hora',
                    start: 'desc',
                    disableClear: false
                  });
                }
                this.loading = false;
                setTimeout(() => {
                  if (this.paginator) this.dataSource.paginator = this.paginator;
                }, 0);
              },
              error: error => this.handleLoadError(error, 'cargar citas', () => this.cargarCitas())
            });
          },
          error: error => this.handleLoadError(error, 'cargar citas', () => this.cargarCitas())
        });
      },
      error: error => this.handleLoadError(error, 'cargar citas', () => this.cargarCitas())
    });
  }

  private handleLoadError(error: unknown, context: string, retry: () => void): void {
    this.logger.error(`Error al cargar citas (${context}):`, error);
    this.loading = false;
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: this.errorMessages.getUserMessage(error, context),
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

  getCitasHoy(): number {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;
    return this.dataSource.data.filter((cita) => {
      const raw = String(cita.fecha || cita.fecha_hora || '');
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10) === key;
      const dt = new Date(raw);
      if (isNaN(dt.getTime())) return false;
      return (
        dt.getFullYear() === hoy.getFullYear() &&
        dt.getMonth() === hoy.getMonth() &&
        dt.getDate() === hoy.getDate()
      );
    }).length;
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

  /** Fecha + hora en una sola línea (filtros / legacy). */
  getFechaFormateada(cita: any): string {
    const fecha = this.getFechaParte(cita);
    const hora = this.getHoraParte(cita);
    if (fecha === 'N/P') {
      return 'N/P';
    }
    return hora ? `${fecha} ${hora}` : fecha;
  }

  getFechaParte(cita: any): string {
    if (cita?.fecha) {
      try {
        const fecha = new Date(cita.fecha);
        if (!isNaN(fecha.getTime())) {
          return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      } catch (error) {
        this.logger.error('❌ Error procesando fecha:', error);
      }
    }
    if (cita?.fecha_hora) {
      try {
        const fecha = new Date(cita.fecha_hora);
        if (!isNaN(fecha.getTime())) {
          return fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      } catch (error) {
        this.logger.error('❌ Error procesando fecha_hora:', error);
      }
    }
    return 'N/P';
  }

  getHoraParte(cita: any): string {
    if (cita?.hora && /^\d{1,2}:\d{2}/.test(String(cita.hora))) {
      return String(cita.hora).slice(0, 5);
    }
    if (cita?.fecha) {
      try {
        const fecha = new Date(cita.fecha);
        if (!isNaN(fecha.getTime()) && String(cita.fecha).includes('T')) {
          return fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch {
        /* ignore */
      }
    }
    if (cita?.fecha_hora) {
      try {
        const fecha = new Date(cita.fecha_hora);
        if (!isNaN(fecha.getTime())) {
          return fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      } catch {
        /* ignore */
      }
    }
    return '';
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

  cambiarEstado(cita: any, nuevoEstado: string, motivoCancelacion?: string) {
    const estadoNorm = String(nuevoEstado || '').toLowerCase();
    const citaActualizada: Record<string, unknown> = {
      ...cita,
      estado: estadoNorm,
      fecha_actualizacion: new Date().toISOString()
    };
    if (estadoNorm === 'cancelada' && motivoCancelacion) {
      citaActualizada['motivo_cancelacion'] = motivoCancelacion.trim();
    }
    this.loadingService.show(LOADING_MESSAGES.updating);
    this.citasService.guardarCita(citaActualizada)
      .then(() => {
        setTimeout(() => {
          Swal.fire({
            title: '¡Éxito!',
            text: `Cita marcada como ${estadoNorm.toUpperCase()}`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
          this.cargarCitas();
        }, 0);
      })
      .catch(error => {
        this.logger.error('Error al cambiar estado:', error);
        setTimeout(() => Swal.fire({
          title: 'Error',
          text: this.errorMessages.getUserMessage(error, 'cambiar estado cita'),
          icon: 'error'
        }), 0);
      })
      .finally(() => this.loadingService.hide());
  }

  async cancelarCita(cita: any): Promise<void> {
    if (!cita) {
      return;
    }
    const result = await Swal.fire({
      title: 'Cancelar cita',
      input: 'textarea',
      inputLabel: 'Motivo de cancelación (obligatorio)',
      inputPlaceholder: 'Describe el motivo…',
      inputAttributes: { 'aria-label': 'Motivo de cancelación' },
      showCancelButton: true,
      confirmButtonText: 'Cancelar cita',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#d33',
      inputValidator: value => {
        if (!value || !String(value).trim() || String(value).trim().length < 3) {
          return 'Indica un motivo de al menos 3 caracteres';
        }
        return null;
      }
    });
    if (result.isConfirmed && result.value) {
      this.cambiarEstado(cita, 'cancelada', String(result.value).trim());
    }
  }

  async revertirAConfirmada(cita: any): Promise<void> {
    if (!cita) {
      return;
    }
    if (!this.puedeRevertirCompletada) {
      Swal.fire({
        title: 'Sin permiso',
        text: 'Solo veterinarias pueden revertir una cita completada.',
        icon: 'warning'
      });
      return;
    }
    this.cambiarEstado(cita, 'confirmada');
  }

  abrirModalCita(cita: any = null, modoVer: boolean = false) {
    const dialogRef = this.dialog.open(CitaDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      data: { cita, modoVer }
    });
    dialogRef.afterClosed().pipe(takeUntil(this.destroy$)).subscribe(result => {
      if (result && !modoVer) {
        this.loadingService.show(LOADING_MESSAGES.saving);
        this.citasService.guardarCita(result)
          .then(() => {
            setTimeout(() => {
              Swal.fire({
                title: '¡Éxito!',
                text: 'Cita guardada correctamente',
                icon: 'success',
                confirmButtonText: 'Entendido'
              });
              this.cargarCitas();
            }, 0);
          })
          .catch(error => {
            this.logger.error('❌ Error al guardar cita:', error);
            setTimeout(() => Swal.fire({
              title: 'Error al guardar cita',
              text: this.errorMessages.getUserMessage(error, 'guardar cita'),
              icon: 'error',
              confirmButtonText: 'Entendido'
            }), 0);
          })
          .finally(() => this.loadingService.hide());
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
        text: 'ID de cita inválido. No se puede borrar.',
        icon: 'error'
      });
      return;
    }
    if (!cita) {
      this.logger.error('❌ ERROR: Cita no encontrada en dataSource con ID:', id);
      Swal.fire({
        title: 'Error',
        text: 'Cita no encontrada. No se puede borrar.',
        icon: 'error'
      });
      return;
    }
    Swal.fire({
      title: '¿Borrar esta cita?',
      text: 'La cita se ocultará del listado. Los datos se conservan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loadingService.show(LOADING_MESSAGES.deleting);
        this.citasService.bajaLogicaCita(id)
          .then(() => {
            setTimeout(() => {
              Swal.fire({
                title: 'Borrado',
                text: 'Cita borrada correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
              });
              this.cargarCitas();
            }, 0);
          })
          .catch(error => {
            this.logger.error('❌ Error al eliminar cita:', error);
            setTimeout(() => Swal.fire({
              title: 'Error',
              text: this.errorMessages.getUserMessage(error, 'eliminar cita'),
              icon: 'error'
            }), 0);
          })
          .finally(() => this.loadingService.hide());
      }
    });
  }

  /** Spec 031: cobro desde cita completada → caja (categoría consulta). */
  registrarEnCaja(cita: any): void {
    if (!cita?.id) return;
    if (cita.cajaMovimientoId) {
      Swal.fire({
        icon: 'info',
        title: 'Ya vinculado a caja',
        text: `Esta cita ya tiene movimiento ${cita.cajaMovimientoId}. Evita doble cobro.`
      });
      return;
    }
    const estado = String(cita.estado || '').toLowerCase();
    if (estado !== 'completada') {
      Swal.fire({
        icon: 'info',
        title: 'Completa la cita primero',
        text: 'Solo las citas completadas se registran en caja desde este atajo.'
      });
      return;
    }
    const paciente = cita.paciente || this.pacientesMap[cita.paciente_id] || 'paciente';
    const cliente = cita.cliente || this.clientesMap[cita.cliente_id] || '';
    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        fechaDefault: (cita.fecha_hora || cita.fecha || '').toString().slice(0, 10) || undefined,
        citaId: cita.id,
        clienteId: cita.cliente_id || undefined,
        concepto: `Consulta · ${paciente}${cliente ? ` · ${cliente}` : ''} · ${cita.motivo || 'cita'}`,
        monto: Number(cita.precio) || Number(cita.monto) || 0,
        metodoPago: 'efectivo',
        notas: cita.observaciones || '',
        categoria: 'consulta' as const
      }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((result) => {
      const id = result?.movimientoId as string | undefined;
      if (!result || (!result.ok && !id) || !id) return;
      this.loadingService.show(LOADING_MESSAGES.updating);
      this.citasService
        .guardarCita({ ...cita, cajaMovimientoId: id })
        .then(() => {
          Swal.fire({ icon: 'success', title: 'Cita vinculada a caja', timer: 1600, showConfirmButton: false });
          this.cargarCitas();
        })
        .catch((error) => {
          this.logger.error('Error al vincular cita→caja:', error);
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'vincular cita a caja'), 'error');
        })
        .finally(() => this.loadingService.hide());
    });
  }

  /** Spec 032: agregar cita a ticket de visita (anti doble cobro). */
  async agregarAVisita(cita: any): Promise<void> {
    if (!cita?.id) return;
    if (cita.cajaMovimientoId) {
      Swal.fire({
        icon: 'info',
        title: 'Ya cobrada en caja',
        text: 'Esta cita ya tiene movimiento de caja. No se agrega al ticket.'
      });
      return;
    }
    if (cita.visitaId) {
      Swal.fire({
        icon: 'info',
        title: 'Ya en una visita',
        text: `Vinculada al ticket ${cita.visitaId}.`
      });
      return;
    }
    if (!cita.cliente_id) {
      Swal.fire('Falta cliente', 'La cita necesita cliente_id para el ticket.', 'warning');
      return;
    }
    const paciente = cita.paciente || this.pacientesMap[cita.paciente_id] || 'paciente';
    const cliente = cita.cliente || this.clientesMap[cita.cliente_id] || '';
    let monto = Number(cita.precio) || Number(cita.monto) || 0;
    if (!(monto > 0)) {
      const ask = await Swal.fire({
        icon: 'question',
        title: 'Monto del servicio',
        input: 'number',
        inputLabel: '¿Cuánto se cobrará por esta cita en el ticket?',
        inputAttributes: { min: '0.01', step: '0.01' },
        inputValue: '',
        showCancelButton: true,
        confirmButtonText: 'Agregar a visita',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          const n = Number(value);
          if (!(n > 0)) return 'Ingresa un monto mayor a 0';
          return null;
        }
      });
      if (!ask.isConfirmed) return;
      monto = Number(ask.value);
    }
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const { visitaId } = await this.visitasService.agregarServicioAVisita({
        cliente_id: cita.cliente_id,
        cliente,
        paciente_id: cita.paciente_id,
        paciente,
        descripcion: `Consulta · ${paciente} · ${cita.motivo || 'cita'}`,
        monto,
        categoria: 'consulta',
        citaId: cita.id,
        fecha: (cita.fecha_hora || cita.fecha || '').toString().slice(0, 10) || undefined
      });
      await this.citasService.guardarCita({ ...cita, visitaId });
      const visita = await this.visitasService.getVisita(visitaId);
      this.dialog.open(VisitaDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        data: { visita: visita || undefined, cliente_id: cita.cliente_id, cliente }
      });
      Swal.fire({ icon: 'success', title: 'Agregada a visita', timer: 1400, showConfirmButton: false });
      this.cargarCitas();
    } catch (error) {
      this.logger.error('Error cita→visita:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'agregar a visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }
}
