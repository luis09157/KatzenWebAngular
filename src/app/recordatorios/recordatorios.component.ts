import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RecordatoriosService } from './recordatorios.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { RecordatorioDialogComponent } from './recordatorio-dialog.component';
import { RecordatorioDetalleComponent } from './recordatorio-detalle.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import Swal from 'sweetalert2/dist/sweetalert2.js';
import { LoggerService } from '../core/logger.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { ADMIN_DIALOG_DETAIL, ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ClientesService } from '../clientes/clientes.service';
import { Cliente, Paciente } from '../core/models';
import { getPacienteClienteId } from '../core/utils/paciente-cliente.util';
import {
  buildMensajeWhatsappRecordatorio,
  buildTelUrl,
  buildWhatsappUrl,
  formatearFechaCortaEs,
  normalizarTelefonoMx,
  tieneTelefonoCapturado,
} from './recordatorio-whatsapp.util';

/** Fila de la tabla: recordatorio RTDB + campos derivados para UI (spec 066). */
interface RecordatorioRow {
  id: string;
  paciente: string;
  fecha_recordatorio: string;
  /** Fecha cruda (ISO local) para el mensaje de WhatsApp. */
  fechaRaw: string;
  clienteNombre: string;
  telefonoCapturado: boolean;
  whatsappTel: string | null;
  whatsappUrl: string;
  telUrl: string;
  whatsappChip: string;
  whatsappEnviadoEn?: number;
  [key: string]: unknown;
}

@Component({
  selector: 'app-recordatorios',
  templateUrl: './recordatorios.component.html',
  styleUrls: ['./recordatorios.component.css'],
})
export class RecordatoriosComponent implements OnInit, OnDestroy, AfterViewInit {
  private readonly destroy$ = new Subject<void>();
  displayedColumns: string[] = ['fecha_recordatorio', 'titulo', 'tipo', 'estado', 'prioridad', 'paciente', 'acciones'];
  menuContext: RecordatorioRow | null = null;
  dataSource = new MatTableDataSource<RecordatorioRow>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;
  pacientesMap: { [id: string]: string } = {};
  private pacientesById: { [id: string]: Paciente } = {};
  private clientesById: { [id: string]: Cliente } = {};
  /** Recordatorios activos sin enriquecer (para re-mapear cuando llegan clientes). */
  private recordatoriosCrudos: Array<Record<string, unknown>> = [];
  loading = false;
  estadisticas = {
    total: 0,
    pendientes: 0,
    completados: 0,
    pacientesUnicos: 0,
  };

  constructor(
    private recordatoriosService: RecordatoriosService,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private dialog: MatDialog,
    private logger: LoggerService,
    private loadingService: LoadingService
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filtro) => {
      const texto = [row['titulo'], row.paciente, row['tipo'], row['estado'], row['prioridad'], row.clienteNombre]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return texto.includes(filtro);
    };
    // Spec 066: teléfono del dueño para WhatsApp / Llamar. Si falla, la tabla sigue sin esas acciones.
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientes) => {
          const mapa: { [id: string]: Cliente } = {};
          (clientes || []).forEach((c) => {
            if (c.id) mapa[String(c.id)] = c;
          });
          this.clientesById = mapa;
          this.refrescarFilas();
        },
        error: (error) => this.logger.warn('Recordatorios: no se pudieron cargar clientes para WhatsApp', error),
      });
    this.pacientesService
      .getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pacientes) => {
          (pacientes || []).forEach((p: Paciente) => {
            if (!p.id) return;
            this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
            this.pacientesById[p.id] = p;
          });
          this.cargarRecordatorios();
        },
        error: (error) => {
          this.logger.error('Error al cargar pacientes para recordatorios:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los datos de pacientes.',
            showCancelButton: true,
            confirmButtonText: 'Reintentar',
            cancelButtonText: 'Cerrar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.ngOnInit();
            }
          });
        },
      });
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarRecordatorios() {
    this.loading = true;
    this.recordatoriosService
      .getRecordatorios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (recordatorios) => {
          const recordatoriosActivos = (recordatorios || []).filter((r: { activo?: boolean }) => r.activo !== false);
          this.recordatoriosCrudos = recordatoriosActivos;
          this.refrescarFilas();
          this.calcularEstadisticas(recordatoriosActivos);
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar recordatorios:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los recordatorios.',
            showCancelButton: true,
            confirmButtonText: 'Reintentar',
            cancelButtonText: 'Cerrar',
          }).then((result) => {
            if (result.isConfirmed) {
              this.cargarRecordatorios();
            }
          });
        },
      });
  }

  /** Re-mapea filas con lo que haya de pacientes/clientes (llegan por separado). */
  private refrescarFilas(): void {
    this.dataSource.data = this.recordatoriosCrudos.map((r) => this.enriquecerFila(r));
  }

  private enriquecerFila(recordatorio: Record<string, unknown>): RecordatorioRow {
    const pacienteId = String(recordatorio['paciente_id'] || '');
    const paciente = this.pacientesById[pacienteId];
    const clienteId = String(recordatorio['cliente_id'] || getPacienteClienteId(paciente) || '');
    const cliente = clienteId ? this.clientesById[clienteId] : undefined;
    const telefonoRaw = cliente ? String(cliente.telefono ?? '') : '';
    const whatsappTel = normalizarTelefonoMx(telefonoRaw);
    const fechaRaw = String(recordatorio['fecha_hora_recordatorio'] || recordatorio['fecha_recordatorio'] || '');
    const nombreMascota = paciente?.nombre || this.pacientesMap[pacienteId] || '';
    const clienteNombre = cliente
      ? [cliente.nombre, cliente.apellidoPaterno].filter(Boolean).join(' ').trim() || String(cliente.razonSocial || '')
      : '';
    const whatsappUrl = whatsappTel
      ? buildWhatsappUrl(
          whatsappTel,
          buildMensajeWhatsappRecordatorio({
            nombreDueno: cliente?.nombre || clienteNombre,
            nombreMascota,
            tipo: String(recordatorio['tipo'] || ''),
            fecha: fechaRaw,
            titulo: String(recordatorio['titulo'] || ''),
          })
        )
      : '';
    const enviadoEn = Number(recordatorio['whatsappEnviadoEn']) || undefined;
    return {
      ...recordatorio,
      id: String(recordatorio['id'] || ''),
      paciente: nombreMascota || 'N/P',
      fecha_recordatorio: this.formatearFecha(recordatorio['fecha_recordatorio']),
      fechaRaw,
      clienteNombre,
      telefonoCapturado: tieneTelefonoCapturado(telefonoRaw),
      whatsappTel,
      whatsappUrl,
      telUrl: whatsappTel ? buildTelUrl(whatsappTel) : '',
      whatsappChip: enviadoEn ? formatearFechaCortaEs(enviadoEn) : '',
      whatsappEnviadoEn: enviadoEn,
    };
  }

  /**
   * Spec 066: el enlace `wa.me` abre en pestaña nueva (href nativo); aquí solo registramos
   * `whatsappEnviadoEn` (campo opcional aditivo). El listado se refresca solo (snapshotChanges).
   */
  async marcarWhatsappEnviado(recordatorio: RecordatorioRow | null): Promise<void> {
    if (!recordatorio?.id || !recordatorio.whatsappTel) return;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      await this.recordatoriosService.actualizarRecordatorio(recordatorio.id, { whatsappEnviadoEn: Date.now() });
      this.loadingService.hide();
    } catch (error) {
      this.loadingService.hide();
      this.logger.error('No se pudo registrar el envío por WhatsApp:', error);
      setTimeout(
        () =>
          Swal.fire({
            icon: 'warning',
            title: 'WhatsApp abierto',
            text: 'Se abrió el mensaje, pero no se pudo guardar la marca «enviado». Intenta de nuevo.',
          }),
        0
      );
    }
  }

  calcularEstadisticas(recordatorios: any[]) {
    this.estadisticas.total = recordatorios.length;
    this.estadisticas.pendientes = recordatorios.filter((r) => r.estado === 'pendiente').length;
    this.estadisticas.completados = recordatorios.filter((r) => r.estado === 'completado').length;

    // Pacientes únicos
    const pacientesIds = [...new Set(recordatorios.map((r) => r.paciente_id))];
    this.estadisticas.pacientesUnicos = pacientesIds.length;
  }

  formatearFecha(fecha: any): string {
    if (!fecha) return 'N/P';

    try {
      if (fecha instanceof Date) {
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        });
      }

      if (typeof fecha === 'string') {
        const date = new Date(fecha);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
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

  abrirModalRecordatorio(recordatorio: any = null) {
    // Si es un recordatorio existente (edición), abrir directamente
    if (recordatorio && recordatorio.id) {
      const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        panelClass: ['admin-dialog-panel', 'recordatorio-dialog-container'],
        data: recordatorio,
      });

      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          if (result) {
            this.loadingService.hide();
            this.cargarRecordatorios();
          }
        });
    } else {
      const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        panelClass: ['admin-dialog-panel', 'recordatorio-dialog-container'],
        data: {},
      });

      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          if (result) {
            this.loadingService.hide();
            this.cargarRecordatorios();
          }
        });
    }
  }

  abrirRegistrarDesparasitacion(): void {
    const dialogRef = this.dialog.open(RecordatorioDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      panelClass: ['admin-dialog-panel', 'recordatorio-dialog-container'],
      data: { registrarDesparasitacion: true },
    });
    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loadingService.hide();
          this.cargarRecordatorios();
        }
      });
  }

  editarRecordatorio(recordatorio: any) {
    this.abrirModalRecordatorio(recordatorio);
  }

  verRecordatorio(recordatorio: any) {
    this.dialog.open(RecordatorioDetalleComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: recordatorio,
    });
  }

  async eliminarRecordatorio(recordatorio: any) {
    const result = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar este recordatorio?',
      text: 'El recordatorio se ocultará del listado. Los datos se conservan.',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      this.loadingService.show();
      try {
        await this.recordatoriosService.eliminarRecordatorio(recordatorio.id);
        this.loadingService.hide();
        setTimeout(() => {
          Swal.fire({ icon: 'success', title: 'Borrado', text: 'Recordatorio borrado correctamente' });
          this.cargarRecordatorios();
        }, 0);
      } catch (error) {
        this.loadingService.hide();
        setTimeout(() => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo borrar el recordatorio' }), 0);
      }
    }
  }

  async cambiarEstado(recordatorio: any, nuevoEstado: string) {
    this.loadingService.show();
    try {
      if (nuevoEstado === 'completado') {
        await this.recordatoriosService.marcarCompletado(recordatorio.id);
      } else {
        await this.recordatoriosService.marcarPendiente(recordatorio.id);
      }
      this.loadingService.hide();
      setTimeout(() => {
        Swal.fire({ icon: 'success', title: '¡Estado actualizado!', text: `Recordatorio marcado como ${nuevoEstado}` });
        this.cargarRecordatorios();
      }, 0);
    } catch (error) {
      this.loadingService.hide();
      setTimeout(
        () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado del recordatorio' }),
        0
      );
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

  getTipoIcono(tipo: string): string {
    switch (tipo) {
      case 'vacuna':
        return 'vaccines';
      case 'desparasitacion':
        return 'bug_report';
      case 'consulta':
        return 'medical_services';
      case 'cirugia':
        return 'healing';
      case 'revision':
        return 'visibility';
      case 'medicamento':
        return 'medication';
      default:
        return 'notifications';
    }
  }
}
