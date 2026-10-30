import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { avisoBreve } from '../core/ui/aviso-breve';
import { MatTabGroup } from '@angular/material/tabs';
import { Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { PacientesService } from './pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { HistorialesService } from '../historiales/historiales.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { VacunasService } from '../vacunas/vacunas.service';
import { BaniosPacienteService } from './banios-paciente.service';
import { PacienteDialogComponent } from './paciente-dialog.component';
import { Router, ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { HistorialDialogComponent } from '../historiales/historial-dialog.component';
import { RecordatorioDialogComponent } from '../recordatorios/recordatorio-dialog.component';
import { VacunaDialogComponent } from '../vacunas/vacuna-dialog.component';
import { VacunaDetalleComponent } from '../vacunas/vacuna-detalle.component';
import { HistorialDetalleComponent } from '../historiales/historial-detalle.component';
import { abrirRecetaDialog } from '../historiales/receta-dialog.component';
import { RecordatorioDetalleComponent } from '../recordatorios/recordatorio-detalle.component';
import { CitaDialogComponent } from '../citas/cita-dialog.component';
import { CitasService } from '../citas/citas.service';
import { PensionDialogComponent } from '../pension/pension-dialog.component';
import { VisitaDialogComponent } from '../visitas/visita-dialog.component';
import { BaniosPacienteComponent } from './banios-paciente.component';
import { ConsentimientoDialogComponent } from '../consentimientos/consentimiento-dialog.component';
import { ConsentimientosService } from '../consentimientos/consentimientos.service';
import { Consentimiento, CONSENTIMIENTO_TIPO_LABELS } from '../consentimientos/consentimientos.models';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_DETAIL, ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoggerService } from '../core/logger.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { getPacienteClienteId as resolvePacienteClienteId } from '../core/utils/paciente-cliente.util';
import { getClienteNombreCompleto } from '../core/utils/cliente-search.util';
import {
  filtrarPacientesPorTexto,
  getPacienteBusquedaExpedienteLabel,
  getPacienteNombre,
} from '../core/utils/paciente-search.util';
import { collectRelatedIds } from '../core/utils/rtdb-row.util';
import { etiquetaExpedientePaciente } from '../core/utils/folio-expediente-paciente.util';
import {
  calcularEdadPaciente,
  formatearFechaExpediente,
  formatearFechaLogActividad,
  getPacienteInfoResumen,
  getTiempoTranscurrido as tiempoTranscurridoExpediente,
} from './paciente-fecha.util';
import { getColorActividadExpediente, getIconoActividadExpediente } from './paciente-timeline.util';
import { AuthProfileService } from '../core/services/auth-profile.service';

@Component({
  selector: 'app-pacientes',
  templateUrl: './pacientes.component.html',
  styleUrls: ['./pacientes.component.scss'],
})
export class PacientesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(BaniosPacienteComponent) baniosPacienteCmp?: BaniosPacienteComponent;
  @ViewChild('expedienteTabs') expedienteTabs?: MatTabGroup;

  // Propiedades para la nueva vista
  searchTerm: string = '';
  pacientesFiltrados: any[] = [];
  pacienteSeleccionado: any = null;
  allPacientes: any[] = [];
  allClientes: any[] = [];

  // Propiedades para vacunas
  nuevaVacuna: string = '';
  observacionesVacuna: string = '';
  proximaVacuna: string = '';
  fechaVacuna: Date | null = null;

  // Propiedades para recordatorios
  recordatorios: any[] = [];

  // Propiedades para vacunas
  vacunas: any[] = [];
  consentimientos: Consentimiento[] = [];
  readonly tipoConsentimiento = CONSENTIMIENTO_TIPO_LABELS;
  logActividades: any[] = [];

  // Propiedades para baños
  banios: any[] = [];

  // Control de estado
  isCreatingHistorial = false;
  loading = false;
  private initialLoadPending = 2;
  private initialLoadFailed = false;
  private lastLoadError: unknown = null;
  private routePacienteId: string | null = null;
  private warnedMissingRouteId = false;
  private queryLookupInFlight: string | null = null;

  historialClinico: any[] = [];

  // Propiedades originales
  displayedColumns: string[] = [
    'nombre',
    'especie',
    'raza',
    'sexo',
    'edad',
    'color',
    'peso',
    'nombreCliente',
    'acciones',
  ];
  dataSource!: MatTableDataSource<any>;

  constructor(
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private historialesService: HistorialesService,
    private recordatoriosService: RecordatoriosService,
    private vacunasService: VacunasService,
    private consentimientosService: ConsentimientosService,
    private baniosPacienteService: BaniosPacienteService,
    private citasService: CitasService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService,
    private loadingService: LoadingService,
    private authProfileService: AuthProfileService
  ) {}

  ngOnInit() {
    this.verificarAccesoDirectorio();
    this.loading = true;
    this.initialLoadPending = 2;
    this.initialLoadFailed = false;
    this.lastLoadError = null;
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const nextId = params.get('id');
      if (nextId !== this.routePacienteId) {
        this.warnedMissingRouteId = false;
        this.queryLookupInFlight = null;
      }
      this.routePacienteId = nextId;
      this.tryOpenFromQuery();
    });
    this.pacientesService
      .getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pacientes) => {
          this.allPacientes = (pacientes || []).filter((p: { activo?: boolean }) => p.activo !== false);
          this.filtrarPacientes();
          this.finishInitialLoad();
          this.tryOpenFromQuery();
        },
        error: (error) => this.handleInitialLoadError(error),
      });
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientes) => {
          this.allClientes = clientes || [];
          this.filtrarPacientes();
          this.finishInitialLoad();
          this.tryOpenFromQuery();
        },
        error: (error) => this.handleInitialLoadError(error),
      });
  }

  private finishInitialLoad(): void {
    this.initialLoadPending--;
    if (this.initialLoadPending <= 0) {
      this.loading = false;
      if (this.initialLoadFailed) {
        this.showInitialLoadError();
      }
    }
  }

  private handleInitialLoadError(error: unknown): void {
    this.logger.error('Error al cargar datos del expediente:', error);
    this.initialLoadFailed = true;
    this.lastLoadError = error;
    this.finishInitialLoad();
  }

  private showInitialLoadError(): void {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: this.errorMessages.getUserMessage(this.lastLoadError, 'cargar pacientes expediente'),
      showCancelButton: true,
      confirmButtonText: 'Reintentar',
      cancelButtonText: 'Cerrar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.ngOnInit();
      }
    });
  }

  private handleExpedienteSectionError(context: string, error: unknown): void {
    this.logger.error(`Error en expediente (${context}):`, error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: this.errorMessages.getUserMessage(error, context),
      toast: true,
      position: 'top-end',
      timer: 4500,
      showConfirmButton: false,
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchInput(event: any) {
    // Obtener el valor del input de forma segura
    const value = event?.target?.value || '';
    this.searchTerm = value;
    this.filtrarPacientes();
  }

  filtrarPacientes() {
    try {
      this.pacientesFiltrados = filtrarPacientesPorTexto(this.allPacientes, this.searchTerm, (p) =>
        this.getClienteNombreFromPaciente(p)
      );
    } catch (error) {
      console.error('Error en filtrarPacientes:', error);
      this.pacientesFiltrados = [];
    }
  }

  seleccionarPaciente(paciente: any, updateUrl = true) {
    this.pacienteSeleccionado = paciente;
    if (updateUrl && paciente?.id) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { id: paciente.id },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
    const extra = this.idsClinicos(paciente);
    this.cargarHistorialClinico(paciente.id, extra);
    this.cargarRecordatorios(paciente.id, extra);
    this.cargarVacunas(paciente.id, extra);
    this.cargarConsentimientos(paciente.id);
    this.cargarBanios(paciente.id, extra);
    this.cargarLogActividades(paciente.id);
  }

  private idsClinicos(paciente: any): string[] {
    return collectRelatedIds(paciente as Record<string, unknown>, ['idPaciente', 'paciente_id']);
  }

  private pacienteCoincideConQuery(
    paciente: { id?: string; idPaciente?: string; idLegacy?: string } | null | undefined,
    id: string
  ): boolean {
    if (!paciente || !id) {
      return false;
    }
    return collectRelatedIds(paciente as Record<string, unknown>, ['idPaciente']).includes(id);
  }

  private warnPacienteNoEncontrado(): void {
    if (this.warnedMissingRouteId) {
      return;
    }
    this.warnedMissingRouteId = true;
    void Swal.fire({
      icon: 'info',
      title: 'Paciente no encontrado',
      text: 'No hay un paciente con ese identificador. Prueba buscarlo por nombre.',
    });
  }

  private tryOpenFromQuery(): void {
    if (this.loading || this.initialLoadPending > 0) {
      return;
    }
    const id = this.routePacienteId;
    if (!id) {
      return;
    }
    if (this.pacienteCoincideConQuery(this.pacienteSeleccionado, id)) {
      return;
    }
    const found = this.allPacientes.find((p) => this.pacienteCoincideConQuery(p, id));
    if (found) {
      this.seleccionarPaciente(found, false);
      return;
    }
    if (this.queryLookupInFlight === id) {
      return;
    }
    this.queryLookupInFlight = id;
    this.pacientesService
      .getPaciente(id)
      .pipe(take(1), takeUntil(this.destroy$))
      .subscribe({
        next: (paciente) => {
          if (this.queryLookupInFlight !== id || this.routePacienteId !== id) {
            return;
          }
          this.queryLookupInFlight = null;
          if (paciente) {
            this.seleccionarPaciente(paciente, false);
            return;
          }
          this.warnPacienteNoEncontrado();
        },
        error: () => {
          if (this.queryLookupInFlight !== id || this.routePacienteId !== id) {
            return;
          }
          this.queryLookupInFlight = null;
          this.warnPacienteNoEncontrado();
        },
      });
  }

  cargarHistorialClinico(pacienteId: string, extraIds: string[] = []) {
    this.historialesService
      .getHistorialesPorPaciente(pacienteId, extraIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historiales) => {
          this.historialClinico = historiales.map((historial) => ({
            ...historial,
            fecha_formateada: this.formatearFecha(historial.fecha_registro),
            tiempo_transcurrido: this.getTiempoTranscurrido(historial.fecha_registro),
          }));
        },
        error: (error) => {
          this.historialClinico = [];
          this.handleExpedienteSectionError('cargar historial expediente', error);
        },
      });
  }

  getTiempoTranscurrido(fecha: any): string {
    return tiempoTranscurridoExpediente(fecha);
  }

  formatearFecha(fecha: any): string {
    return formatearFechaExpediente(fecha);
  }

  // Métodos para recordatorios
  cargarRecordatorios(pacienteId: string, extraIds: string[] = []) {
    this.recordatoriosService
      .getRecordatoriosPorPaciente(pacienteId, extraIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recordatorios) => {
          this.recordatorios = (recordatorios || []).map((r) => {
            // Buscar el campo de fecha correcto
            const fechaRaw = r.fecha_hora_recordatorio || r.fecha_recordatorio || null;
            let fecha = null;
            if (fechaRaw) {
              fecha = new Date(fechaRaw);
            }
            let fecha_formateada = 'No disponible';
            if (fecha && !isNaN(fecha.getTime())) {
              fecha_formateada = fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              });
            }
            let estadoTiempo = '';
            if (fecha && !isNaN(fecha.getTime())) {
              const ahora = new Date();
              const diferencia = fecha.getTime() - ahora.getTime();
              const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
              if (dias < 0) {
                estadoTiempo = `Vencido hace ${Math.abs(dias)} día${Math.abs(dias) > 1 ? 's' : ''}`;
              } else if (dias === 0) {
                estadoTiempo = 'Hoy';
              } else if (dias === 1) {
                estadoTiempo = 'Mañana';
              } else if (dias < 7) {
                estadoTiempo = `En ${dias} días`;
              } else {
                const semanas = Math.floor(dias / 7);
                estadoTiempo = `En ${semanas} semana${semanas > 1 ? 's' : ''}`;
              }
            }
            return {
              ...r,
              fecha_formateada,
              estado_tiempo: estadoTiempo,
            };
          });
        },
        error: (error) => {
          this.recordatorios = [];
          this.handleExpedienteSectionError('cargar recordatorios expediente', error);
        },
      });
  }

  agregarRecordatorio() {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {
        paciente_id: this.pacienteSeleccionado.id,
        cliente_id: this.getPacienteClienteId(this.pacienteSeleccionado),
        paciente: this.pacienteSeleccionado,
        cliente: this.getClienteNombreFromPaciente(this.pacienteSeleccionado),
        cliente_nombre: this.getClienteNombreFromPaciente(this.pacienteSeleccionado),
        desdePaciente: true,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarRecordatorios(this.pacienteSeleccionado.id);

          const datosParaLog = {
            titulo: result.titulo || 'Sin título',
            fecha_hora_recordatorio: result.fecha_hora_recordatorio || result.fecha_recordatorio,
            prioridad: result.prioridad || 'media',
            paciente_id: this.pacienteSeleccionado.id,
            id: result.id,
          };

          this.pacientesService
            .registrarRecordatorio(this.pacienteSeleccionado.id, datosParaLog)
            .then(() => {
              this.cargarLogActividades(this.pacienteSeleccionado.id);
            })
            .catch((error) => {
              this.logger.error('Error al registrar recordatorio en log:', error);
            });
        }
      });
  }

  agregarDesparasitacion(): void {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {
        paciente_id: this.pacienteSeleccionado.id,
        cliente_id: this.getPacienteClienteId(this.pacienteSeleccionado),
        paciente: this.pacienteSeleccionado,
        cliente: this.getClienteNombreFromPaciente(this.pacienteSeleccionado),
        cliente_nombre: this.getClienteNombreFromPaciente(this.pacienteSeleccionado),
        desdePaciente: true,
        registrarDesparasitacion: true,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarRecordatorios(this.pacienteSeleccionado.id);
          this.cargarLogActividades(this.pacienteSeleccionado.id);
        }
      });
  }

  editarRecordatorio(recordatorio: any) {
    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: recordatorio,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarRecordatorios(this.pacienteSeleccionado.id);
          void avisoBreve('Recordatorio actualizado correctamente');
        }
      });
  }

  eliminarRecordatorio(recordatorio: any) {
    Swal.fire({
      icon: 'warning',
      title: '¿Borrar este recordatorio?',
      text: 'El recordatorio se ocultará del listado. Los datos se conservan.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.recordatoriosService
          .bajaLogicaRecordatorio(recordatorio.id)
          .then(() => {
            this.cargarRecordatorios(this.pacienteSeleccionado.id);
            void avisoBreve('Borrado', 'Recordatorio borrado correctamente');
          })
          .catch((error) => {
            console.error('Error al eliminar recordatorio:', error);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo borrar el recordatorio',
            });
          });
      }
    });
  }

  cambiarEstadoRecordatorio(recordatorio: any, nuevoEstado: string) {
    if (nuevoEstado === 'completado') {
      this.recordatoriosService.marcarCompletado(recordatorio.id).then(() => {
        this.cargarRecordatorios(this.pacienteSeleccionado.id);
        void avisoBreve('¡Completado!', 'Recordatorio marcado como completado');
      });
    } else {
      this.recordatoriosService.marcarPendiente(recordatorio.id).then(() => {
        this.cargarRecordatorios(this.pacienteSeleccionado.id);
        void avisoBreve('¡Pendiente!', 'Recordatorio marcado como pendiente');
      });
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'completado':
        return '#4caf50';
      case 'pendiente':
        return '#ff9800';
      case 'cancelado':
        return '#f44336';
      default:
        return '#666';
    }
  }

  getPrioridadColor(prioridad: string): string {
    switch (prioridad) {
      case 'urgente':
        return '#9c27b0';
      case 'alta':
        return '#f44336';
      case 'media':
        return '#ff9800';
      case 'baja':
        return '#4caf50';
      default:
        return '#666';
    }
  }

  // Métodos para CRUD del historial clínico
  agregarHistorialClinico() {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    // Evitar múltiples clics
    if (this.isCreatingHistorial) {
      return;
    }

    this.isCreatingHistorial = true;

    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {
        historial: null,
        modoVer: false,
        paciente_id: this.pacienteSeleccionado.id,
        cliente_id: this.getPacienteClienteId(this.pacienteSeleccionado),
        paciente: this.pacienteSeleccionado.nombre,
        cliente: this.getClienteNombreFromPaciente(this.pacienteSeleccionado),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarHistorialClinico(this.pacienteSeleccionado.id);

          const datosParaLog = {
            diagnostico_presuntivo: result.diagnostico_presuntivo || 'Sin diagnóstico',
            manejo_terapeutico: result.manejo_terapeutico || 'Sin tratamiento',
            receta: result.receta || 'Sin medicamentos',
            paciente_id: this.pacienteSeleccionado.id,
            id: result.id,
          };

          this.pacientesService
            .registrarHistorialClinico(this.pacienteSeleccionado.id, datosParaLog)
            .then(() => {
              this.cargarLogActividades(this.pacienteSeleccionado.id);
            })
            .catch((error) => {
              this.logger.error('Error al registrar historial en log:', error);
            });
        }

        this.isCreatingHistorial = false;
      });
  }

  /** Celular o tablet (≤900 px): sin doble clic, un toque abre el detalle. */
  esPantallaChica(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 900;
  }

  /** Spec 116.2 — en celular un toque abre el detalle de la consulta, que trae Receta. */
  tocarHistorialMovil(historial: any): void {
    if (this.esPantallaChica()) this.verDetalleHistorial(historial);
  }

  /** Spec 116.2 — receta para el dueño. */
  abrirRecetaHistorial(historial: any): void {
    if (historial) abrirRecetaDialog(this.dialog, historial);
  }

  editarHistorialClinico(historial: any) {
    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {
        historial: historial,
        modoVer: false,
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.historialesService
            .actualizarHistorial(historial.id, result)
            .then(() => {
              void avisoBreve('Historial clínico actualizado correctamente');
              this.cargarHistorialClinico(this.pacienteSeleccionado.id);
              // Registrar en el log
              this.pacientesService.registrarEdicionHistorialClinico(this.pacienteSeleccionado.id, result);
              this.cargarLogActividades(this.pacienteSeleccionado.id);
            })
            .catch((error) => {
              console.error('Error al actualizar historial:', error);
              Swal.fire('Error', 'No se pudo actualizar el historial clínico', 'error');
            });
        }
      });
  }

  verDetalleHistorial(historial: any) {
    this.historialesService
      .getHistorial(historial.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historialCompleto) => {
          this.dialog.open(HistorialDetalleComponent, {
            ...ADMIN_DIALOG_DETAIL,
            data: historialCompleto,
          });
        },
        error: (error) => {
          this.handleExpedienteSectionError('cargar historial detalle', error);
        },
      });
  }

  eliminarHistorialClinico(historial: any) {
    Swal.fire({
      title: '¿Borrar este historial?',
      text: 'Se ocultará en el panel admin. Para ocultarlo del portal del dueño, edítalo y marca "Ocultar del portal".',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.historialesService
          .bajaLogicaHistorial(historial.id)
          .then(() => {
            void avisoBreve('Borrado', 'El historial fue borrado correctamente.');
            this.cargarHistorialClinico(this.pacienteSeleccionado.id);
            // Registrar en el log
            this.pacientesService.registrarEliminacionHistorialClinico(this.pacienteSeleccionado.id, historial);
            this.cargarLogActividades(this.pacienteSeleccionado.id);
          })
          .catch((error) => {
            console.error('Error al dar de baja:', error);
            Swal.fire('Error', 'No se pudo borrar el historial', 'error');
          });
      }
    });
  }

  /**
   * Menú único «Pacientes» (2026-10-26): si el rol tiene directorio, «Volver a Pacientes»
   * regresa ahí; si no (peluquero), regresa a la búsqueda de esta misma pantalla.
   */
  puedeVerDirectorio = false;

  private verificarAccesoDirectorio(): void {
    this.authProfileService
      .canAccessModule('pacientes-admin')
      .then((ok) => (this.puedeVerDirectorio = ok))
      .catch(() => (this.puedeVerDirectorio = false));
  }

  volverAPacientes(): void {
    if (this.puedeVerDirectorio) {
      this.router.navigate(['/admin/pacientes-admin']);
      return;
    }
    this.limpiarSeleccion();
  }

  limpiarSeleccion() {
    this.pacienteSeleccionado = null;
    this.consentimientos = [];
    this.searchTerm = '';
    this.pacientesFiltrados = [];
    this.routePacienteId = null;
    this.warnedMissingRouteId = false;
    this.queryLookupInFlight = null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { id: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  getPacienteClienteId(paciente: any): string {
    return resolvePacienteClienteId(paciente);
  }

  getClienteNombre(idCliente: string): string {
    if (!idCliente) return 'Desconocido';
    const cliente = this.allClientes.find((c) => c.id === idCliente);
    if (!cliente) return 'Desconocido';
    return getClienteNombreCompleto(cliente) || 'Desconocido';
  }

  getClienteNombreFromPaciente(paciente: any): string {
    if (paciente.nombreCliente) {
      return paciente.nombreCliente.trim();
    }
    return this.getClienteNombre(this.getPacienteClienteId(paciente));
  }

  nombrePaciente(paciente: any): string {
    return getPacienteNombre(paciente) || 'Mascota';
  }

  /** Opción del buscador: «— especie · raza · edad · dueño». El nombre va aparte. */
  sufijoOpcionBusqueda(paciente: any): string {
    const dueno = this.getClienteNombre(this.getPacienteClienteId(paciente));
    const full = getPacienteBusquedaExpedienteLabel(paciente, dueno);
    const nombre = getPacienteNombre(paciente) || 'Sin nombre';
    if (full.startsWith(`${nombre} `)) {
      return full.slice(nombre.length).trim();
    }
    return full;
  }

  etiquetaExpediente(paciente: { id?: string; expediente?: string; numeroExpediente?: string } | null): string {
    return etiquetaExpedientePaciente(paciente);
  }

  displayPaciente = (paciente: any): string => {
    if (!paciente) return '';
    const nombre = this.nombrePaciente(paciente);
    const clienteNombre = this.getClienteNombreFromPaciente(paciente);
    return `${nombre} - ${clienteNombre}`;
  };

  toggleSidenav() {
    // Reservado para layout admin si se integra sidenav local
  }

  getClienteTelefono(idCliente: string): string {
    const cliente = this.allClientes.find((c) => c.id === idCliente);
    return cliente?.telefono || 'Sin teléfono';
  }

  getClienteEmail(idCliente: string): string {
    const cliente = this.allClientes.find((c) => c.id === idCliente);
    return cliente?.correo || 'Sin email';
  }

  getClienteDireccion(idCliente: string): string {
    const cliente = this.allClientes.find((c) => c.id === idCliente) as
      { direccion?: string; Direccion?: string } | undefined;
    return String(cliente?.direccion || cliente?.Direccion || '').trim();
  }

  calcularEdad(fechaNacimiento: string): string {
    return calcularEdadPaciente(fechaNacimiento);
  }

  getPacienteInfo(paciente: any): string {
    return getPacienteInfoResumen(paciente);
  }

  // Métodos para vacunas
  cargarVacunas(pacienteId: string, extraIds: string[] = []) {
    this.vacunasService
      .getVacunasPorPaciente(pacienteId, extraIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vacunas) => {
          this.vacunas = vacunas.map((v) => {
            // Usar fechaAplicacion en lugar de fecha, con fallback a fechaRegistro
            const fechaRaw = v.fechaAplicacion || v.fechaRegistro || v.fecha;
            let fecha = null;
            let fecha_formateada = 'N/P';
            let estadoTiempo = '';
            let dias = 0;

            if (fechaRaw) {
              try {
                fecha = new Date(fechaRaw);
                if (!isNaN(fecha.getTime())) {
                  fecha_formateada = fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  });

                  // Calcular tiempo restante
                  const ahora = new Date();
                  const diferencia = fecha.getTime() - ahora.getTime();
                  dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

                  if (dias < 0) {
                    estadoTiempo = `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) > 1 ? 's' : ''}`;
                  } else if (dias === 0) {
                    estadoTiempo = 'Hoy';
                  } else if (dias === 1) {
                    estadoTiempo = 'Mañana';
                  } else if (dias < 7) {
                    estadoTiempo = `En ${dias} días`;
                  } else {
                    const semanas = Math.floor(dias / 7);
                    estadoTiempo = `En ${semanas} semana${semanas > 1 ? 's' : ''}`;
                  }
                }
              } catch {
                fecha_formateada = 'Fecha inválida';
                estadoTiempo = 'N/A';
              }
            }

            return {
              ...v,
              fecha_formateada,
              estado_tiempo: estadoTiempo,
              dias_restantes: dias,
            };
          });
        },
        error: (error) => {
          this.vacunas = [];
          this.handleExpedienteSectionError('cargar vacunas expediente', error);
        },
      });
  }

  agregarVacuna() {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }

    const dialogRef = this.dialog.open(VacunaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {
        paciente_id: this.pacienteSeleccionado.id,
        idPaciente: this.pacienteSeleccionado.id,
        cliente_id: this.getPacienteClienteId(this.pacienteSeleccionado),
        idCliente: this.getPacienteClienteId(this.pacienteSeleccionado),
        paciente: this.pacienteSeleccionado.nombre,
        cliente: this.getClienteNombreFromPaciente(this.pacienteSeleccionado),
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarVacunas(this.pacienteSeleccionado.id);
          this.cargarLogActividades(this.pacienteSeleccionado.id);
        }
      });
  }

  cargarConsentimientos(pacienteId: string): void {
    if (!pacienteId) {
      this.consentimientos = [];
      return;
    }
    this.consentimientosService
      .getPorPaciente(pacienteId)
      .pipe(take(1))
      .subscribe({
        next: (rows) => {
          this.consentimientos = rows || [];
        },
        error: (error) => {
          this.consentimientos = [];
          this.handleExpedienteSectionError('cargar consentimientos expediente', error);
        },
      });
  }

  private datosPacienteConsentimiento(): {
    paciente_id: string;
    paciente: string;
    cliente_id: string;
    cliente: string;
  } | null {
    const paciente = this.pacienteSeleccionado;
    if (!paciente?.id) {
      return null;
    }
    return {
      paciente_id: paciente.id,
      paciente: this.nombrePaciente(paciente),
      cliente_id: this.getPacienteClienteId(paciente),
      cliente: this.getClienteNombreFromPaciente(paciente),
    };
  }

  agregarConsentimiento(): void {
    const pref = this.datosPacienteConsentimiento();
    if (!pref) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }
    const dialogRef = this.dialog.open(ConsentimientoDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { pacientePrefijado: pref },
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarConsentimientos(pref.paciente_id);
        }
      });
  }

  editarConsentimiento(item: Consentimiento): void {
    const dialogRef = this.dialog.open(ConsentimientoDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { consentimiento: item },
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result && this.pacienteSeleccionado?.id) {
          this.cargarConsentimientos(this.pacienteSeleccionado.id);
        }
      });
  }

  eliminarConsentimiento(item: Consentimiento): void {
    if (!item?.id) {
      return;
    }
    Swal.fire({
      title: '¿Borrar consentimiento?',
      text: 'Se marca como revocado y deja de mostrarse en la lista.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (!result.isConfirmed || !item.id) {
        return;
      }
      this.loadingService.show(LOADING_MESSAGES.deleting);
      this.consentimientosService
        .bajaLogica(item.id)
        .then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Consentimiento borrado',
            timer: 1400,
            showConfirmButton: false,
          });
          if (this.pacienteSeleccionado?.id) {
            this.cargarConsentimientos(this.pacienteSeleccionado.id);
          }
        })
        .catch((error) => {
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar consentimiento'), 'error');
        })
        .finally(() => this.loadingService.hide());
    });
  }

  editarVacuna(vacuna: any) {
    const dialogRef = this.dialog.open(VacunaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: vacuna,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarVacunas(this.pacienteSeleccionado.id);
          void avisoBreve('Vacuna actualizada correctamente');
        }
      });
  }

  eliminarVacuna(vacuna: any) {
    Swal.fire({
      title: '¿Borrar esta vacuna?',
      text: 'La vacuna se ocultará del listado. Los datos se conservan.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Usar baja lógica en lugar de eliminación física
        this.vacunasService
          .bajaLogicaVacuna(vacuna.id)
          .then(() => {
            void avisoBreve('Borrada', 'Vacuna borrada correctamente.');
            this.cargarVacunas(this.pacienteSeleccionado.id);
            // Registrar en el log
            this.pacientesService.registrarEliminacionVacuna(this.pacienteSeleccionado.id, vacuna);
            this.cargarLogActividades(this.pacienteSeleccionado.id);
          })
          .catch((error) => {
            console.error('Error al eliminar vacuna:', error);
            Swal.fire('Error', 'No se pudo borrar la vacuna', 'error');
          });
      }
    });
  }

  cambiarEstadoVacuna(vacuna: any, nuevoEstado: string) {
    if (nuevoEstado === 'aplicada') {
      this.vacunasService.marcarAplicada(vacuna.id).then(() => {
        this.cargarVacunas(this.pacienteSeleccionado.id);
        void avisoBreve('¡Aplicada!', 'Vacuna marcada como aplicada');
      });
    } else {
      this.vacunasService.marcarPendiente(vacuna.id).then(() => {
        this.cargarVacunas(this.pacienteSeleccionado.id);
        void avisoBreve('¡Pendiente!', 'Vacuna marcada como pendiente');
      });
    }
  }

  getVacunaEstadoColor(estado: boolean): string {
    return estado ? '#4caf50' : '#ff9800';
  }

  getVacunaIcono(tipo: string): string {
    switch (tipo) {
      case 'quintuple':
        return 'vaccines';
      case 'sextuple':
        return 'vaccines';
      case 'antirrabica':
        return 'security';
      case 'coronavirus':
        return 'coronavirus';
      case 'triple_felina':
        return 'pets';
      case 'leucemia':
        return 'healing';
      case 'parvovirus':
        return 'bug_report';
      case 'moquillo':
        return 'sick';
      case 'hepatitis':
        return 'medical_services';
      default:
        return 'vaccines';
    }
  }

  cargarBanios(pacienteId: string, extraIds: string[] = []) {
    this.baniosPacienteService
      .getBaniosPorPaciente(pacienteId, extraIds)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (banios) => {
          this.banios = banios;
        },
        error: (error) => {
          this.banios = [];
          this.handleExpedienteSectionError('cargar banios expediente', error);
        },
      });
  }

  verVacunaDetalle(vacuna: any) {
    this.dialog.open(VacunaDetalleComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: vacuna,
    });
  }

  verDetalleRecordatorio(recordatorio: any) {
    this.dialog.open(RecordatorioDetalleComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: recordatorio,
    });
  }

  /** Prefill cliente+paciente para diálogos desde expediente (spec 031). */
  private expedienteIds(): {
    paciente_id: string;
    cliente_id: string;
    paciente: string;
    cliente: string;
  } | null {
    if (!this.pacienteSeleccionado?.id) return null;
    return {
      paciente_id: this.pacienteSeleccionado.id,
      cliente_id: this.getPacienteClienteId(this.pacienteSeleccionado),
      paciente: this.pacienteSeleccionado.nombre || '',
      cliente: this.getClienteNombreFromPaciente(this.pacienteSeleccionado),
    };
  }

  agregarCitaDesdeExpediente(): void {
    const ids = this.expedienteIds();
    if (!ids) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }
    const dialogRef = this.dialog.open(CitaDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      data: {
        modoVer: false,
        cita: {
          cliente_id: ids.cliente_id,
          paciente_id: ids.paciente_id,
          paciente: ids.paciente,
          nombreCliente: ids.cliente,
        },
      },
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (!result) return;
        this.loadingService.show(LOADING_MESSAGES.saving);
        this.citasService
          .guardarCita(result)
          .then(() => {
            Swal.fire({ icon: 'success', title: 'Cita guardada', timer: 1600, showConfirmButton: false });
            this.cargarLogActividades(ids.paciente_id);
          })
          .catch((error) => {
            this.logger.error('Error al guardar cita desde expediente:', error);
            Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar cita'), 'error');
          })
          .finally(() => this.loadingService.hide());
      });
  }

  agregarBanioDesdeExpediente(): void {
    if (!this.pacienteSeleccionado) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }
    if (this.baniosPacienteCmp) {
      this.baniosPacienteCmp.agregarBanio();
      return;
    }
    // La pestaña Baños se carga al abrirla: se abre y se espera a que exista el componente.
    this.irAPestanaExpediente(PESTANA_EXPEDIENTE.banios);
    let intentos = 0;
    const esperar = () => {
      if (this.baniosPacienteCmp) {
        this.baniosPacienteCmp.agregarBanio();
        return;
      }
      if (++intentos < 40) {
        setTimeout(esperar, 50);
        return;
      }
      Swal.fire({
        icon: 'info',
        title: 'Abre la pestaña Baños',
        text: 'No se pudo abrir el formulario. Entra a la pestaña Baños y vuelve a intentar.',
      });
    };
    setTimeout(esperar, 0);
  }

  /** «+ Agregar» del expediente (spec 096): un solo botón, siempre visible, con todo rotulado. */
  agregarDesdeMenu(tipo: AgregarExpedienteTipo): void {
    switch (tipo) {
      case 'historial':
        this.irAPestanaExpediente(PESTANA_EXPEDIENTE.historial);
        this.agregarHistorialClinico();
        return;
      case 'recordatorio':
        this.irAPestanaExpediente(PESTANA_EXPEDIENTE.recordatorios);
        this.agregarRecordatorio();
        return;
      case 'vacuna':
        this.irAPestanaExpediente(PESTANA_EXPEDIENTE.vacunas);
        this.agregarVacuna();
        return;
      case 'consentimiento':
        this.irAPestanaExpediente(PESTANA_EXPEDIENTE.consentimientos);
        this.agregarConsentimiento();
        return;
      case 'desparasitacion':
        this.agregarDesparasitacion();
        return;
      case 'banio':
        this.agregarBanioDesdeExpediente();
        return;
      case 'cita':
        this.agregarCitaDesdeExpediente();
        return;
      case 'pension':
        this.agregarPensionDesdeExpediente();
        return;
      case 'cuenta':
        this.agregarVisitaDesdeExpediente();
        return;
    }
  }

  private irAPestanaExpediente(indice: number): void {
    if (this.expedienteTabs && this.expedienteTabs.selectedIndex !== indice) {
      this.expedienteTabs.selectedIndex = indice;
    }
  }

  agregarPensionDesdeExpediente(): void {
    const ids = this.expedienteIds();
    if (!ids) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }
    this.dialog.open(PensionDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      disableClose: true,
      data: {
        paciente_id: ids.paciente_id,
        cliente_id: ids.cliente_id,
        paciente: ids.paciente,
        cliente: ids.cliente,
      },
    });
  }

  /** Spec 032: abrir ticket de visita con cliente+paciente del expediente. */
  agregarVisitaDesdeExpediente(): void {
    const ids = this.expedienteIds();
    if (!ids) {
      Swal.fire('Error', 'Debes seleccionar un paciente primero', 'error');
      return;
    }
    this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {
        paciente_id: ids.paciente_id,
        cliente_id: ids.cliente_id,
        paciente: ids.paciente,
        cliente: ids.cliente,
      },
    });
  }

  cargarLogActividades(pacienteId: string) {
    this.pacientesService
      .getLogActividades(pacienteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (log) => {
          this.logActividades = log;
        },
        error: (error) => {
          this.logActividades = [];
          this.handleExpedienteSectionError('cargar actividad expediente', error);
        },
      });
  }

  getIconoActividad(tipo: string): string {
    return getIconoActividadExpediente(tipo);
  }

  getColorActividad(tipo: string): string {
    return getColorActividadExpediente(tipo);
  }

  formatearFechaLog(fecha: string): string {
    return formatearFechaLogActividad(fecha);
  }

  onBanioCreado(_banio: any) {
    this.cargarBanios(this.pacienteSeleccionado.id);
    this.cargarLogActividades(this.pacienteSeleccionado.id);
  }

  onBanioActualizado(_banio: any) {
    this.cargarBanios(this.pacienteSeleccionado.id);
    this.cargarLogActividades(this.pacienteSeleccionado.id);
  }

  onBanioEliminado(_banio: any) {
    this.cargarBanios(this.pacienteSeleccionado.id);
    this.cargarLogActividades(this.pacienteSeleccionado.id);
  }
}

/** Opciones del menú «+ Agregar» del expediente. */
export type AgregarExpedienteTipo =
  | 'historial'
  | 'vacuna'
  | 'desparasitacion'
  | 'recordatorio'
  | 'consentimiento'
  | 'cita'
  | 'banio'
  | 'pension'
  | 'cuenta';

/** Orden de las pestañas en `pacientes.component.html`. */
const PESTANA_EXPEDIENTE = {
  historial: 0,
  recordatorios: 1,
  vacunas: 2,
  consentimientos: 3,
  banios: 4,
} as const;
