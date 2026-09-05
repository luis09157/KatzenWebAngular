import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { HistorialesService } from './historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { ClientesService } from '../clientes/clientes.service';
import { MigrationService } from '../shared/migration.service';
import { MatDialog } from '@angular/material/dialog';
import { HistorialDialogComponent } from './historial-dialog.component';
import { HistorialDetalleComponent } from './historial-detalle.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { Subject, firstValueFrom, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import { ADMIN_DIALOG_CONFIG, ADMIN_DIALOG_DETAIL, ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { fechaEnRango, normalizeFechaIso, resolverPeriodo } from '../core/utils/periodo-filtro.util';
import { SalidaDialogComponent } from '../inventario/movimientos/salida-dialog.component';
import { InventarioService } from '../inventario/inventario.service';
import { CajaMovimientoDialogComponent } from '../finanzas/caja-movimiento-dialog.component';
import { CajaCategoria } from '../finanzas/caja.models';
import { VisitasService } from '../visitas/visitas.service';
import { VisitaDialogComponent } from '../visitas/visita-dialog.component';
import { promptMontoVisita } from '../visitas/visita-atalho.util';
import { bloquearCobroDirectoEnCaja } from '../core/utils/cobro-integridad.util';
import { AuthProfileService } from '../core/services/auth-profile.service';

@Component({
  selector: 'app-historiales',
  templateUrl: './historiales.component.html',
  styleUrls: ['./historiales.component.css'],
})
export class HistorialesComponent implements OnInit, OnDestroy, AfterViewInit {
  displayedColumns: string[] = [
    'fecha_registro',
    'paciente',
    'diagnostico_presuntivo',
    'medico_atendio',
    'estado',
    'acciones',
  ];
  menuContext: any = null;
  dataSource = new MatTableDataSource<any>([]);
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;
  pacientesMap: { [id: string]: string } = {};
  pacientesClienteMap: { [id: string]: string } = {};
  estadisticas: any = {
    total: 0,
    activos: 0,
    inactivos: 0,
    delMes: 0,
    consultasMes: 0,
    cirugiasMes: 0,
    vacunasMes: 0,
  };
  private historialesRaw: any[] = [];
  loading = false;
  necesitaMigracion = false;
  isAdmin = false;
  /** Spec 069 — migración de datos solo rol extremo. */
  isSuperAdmin = false;
  private destroy$ = new Subject<void>();

  constructor(
    private historialesService: HistorialesService,
    private pacientesService: PacientesService,
    private clientesService: ClientesService,
    private migrationService: MigrationService,
    private dialog: MatDialog,
    private loadingService: LoadingService,
    private logger: LoggerService,
    private errorMessages: ErrorMessagesService,
    private inventarioService: InventarioService,
    private visitasService: VisitasService,
    private authProfileService: AuthProfileService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.authProfileService.getAccessibleModules().then((modules) => {
      this.isAdmin = modules.includes('usuarios');
    });
    this.authProfileService.getEffectiveStaffRole().then((role) => {
      this.isSuperAdmin = role === 'super_admin';
    });
    this.cargarDatos();
    this.cargarEstadisticas();
    this.verificarMigracion();
  }

  ngAfterViewInit(): void {
    if (this.paginator) this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  verificarMigracion() {
    this.migrationService
      .verificarHistorialesParaMigracion()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (necesita) => {
          this.necesitaMigracion = necesita;
          this.logger.log('Verificación de migración completada:', necesita);
        },
        error: (error) => {
          this.logger.error('Error al verificar migración:', error);
          this.necesitaMigracion = false;
        },
      });
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
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        this.loading = true;
        await this.migrationService.migrarHistoriales();

        // Recargar datos después de la migración
        this.cargarDatos();
        this.verificarMigracion();

        Swal.fire({
          icon: 'success',
          title: 'Migración Completada',
          text: 'La base de datos ha sido migrada exitosamente. Todos los historiales ahora usan la nueva estructura.',
        });
      } catch (error) {
        this.logger.error('Error en migración:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error en Migración',
          text: 'Ocurrió un error durante la migración. Por favor, inténtalo de nuevo.',
        });
      } finally {
        this.loading = false;
      }
    }
  }

  cargarDatos() {
    this.pacientesService
      .getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pacientes) => {
          (pacientes || []).forEach((p) => {
            this.pacientesMap[p.id] = p.nombre ? p.nombre : 'N/P';
            this.pacientesClienteMap[p.id] = (p as any).cliente_id || (p as any).idCliente || '';
          });
          this.cargarHistoriales();
        },
        error: (error) => {
          this.logger.error('Error al cargar pacientes:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los pacientes',
          });
        },
      });
  }

  cargarHistoriales() {
    this.historialesService
      .getHistorialesActivos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historiales) => {
          this.historialesRaw = historiales || [];
          this.dataSource.data = (historiales || []).map((historial) => ({
            ...historial,
            paciente: this.pacientesMap[historial.paciente_id] || 'N/P',
            fecha_registro: this.formatearFecha(historial.fecha_registro),
          }));
          this.calcularKpisMes();
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar historiales:', error);
          this.loading = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar los historiales',
          });
        },
      });
  }

  cargarEstadisticas() {
    this.historialesService
      .getEstadisticasHistoriales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.estadisticas = { ...this.estadisticas, ...stats };
          this.calcularKpisMes();
          this.logger.log('Estadísticas cargadas:', stats);
        },
        error: (error) => {
          this.logger.error('Error al cargar estadísticas:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: this.errorMessages.getUserMessage(error, 'cargar estadisticas historiales'),
          });
        },
      });
  }

  getHistorialesRecientes(): number {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    return this.historialesRaw.filter((historial) => {
      const f = normalizeFechaIso(historial.fecha_registro);
      if (!f) return false;
      return new Date(f + 'T12:00:00') >= hace30Dias;
    }).length;
  }

  private clasificarHistorialTipo(historial: any): 'consulta' | 'cirugia' | 'vacuna' {
    const diag = String(historial.diagnostico_presuntivo || historial.diagnostico || '').toLowerCase();
    const trat = String(historial.tratamiento || '').toLowerCase();
    const tipo = String(historial.tipo || historial.tipo_consulta || '').toLowerCase();
    const blob = `${diag} ${trat} ${tipo}`;
    if (/cirug|qx|esteriliz|castrac|ovario|laparo|abdominoplast/.test(blob)) {
      return 'cirugia';
    }
    if (/vacun|inmuniz|refuerzo|antirr|desparasit/.test(blob)) {
      return 'vacuna';
    }
    return 'consulta';
  }

  calcularKpisMes(): void {
    const rango = resolverPeriodo('este_mes');
    const delMes = (this.historialesRaw || []).filter(
      (h) => h.activo !== false && fechaEnRango(h.fecha_registro, rango)
    );
    this.estadisticas.delMes = delMes.length;
    this.estadisticas.consultasMes = delMes.filter((h) => this.clasificarHistorialTipo(h) === 'consulta').length;
    this.estadisticas.cirugiasMes = delMes.filter((h) => this.clasificarHistorialTipo(h) === 'cirugia').length;
    this.estadisticas.vacunasMes = delMes.filter((h) => this.clasificarHistorialTipo(h) === 'vacuna').length;
  }

  getPacientesUnicos(): number {
    const pacientesUnicos = new Set(
      this.historialesRaw.map((historial) => historial.paciente_id).filter((id) => id && id !== 'N/P')
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
          minute: '2-digit',
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
            minute: '2-digit',
          });
        }
      }

      return 'N/P';
    } catch (error) {
      this.logger.error('Error al formatear fecha:', error);
      return 'N/P';
    }
  }

  aplicarFiltro(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  abrirModalHistorial(pacienteId?: string) {
    if (!pacienteId) {
      const dialogRef = this.dialog.open(HistorialDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        data: { modoVer: false },
      });

      dialogRef
        .afterClosed()
        .pipe(takeUntil(this.destroy$))
        .subscribe((result) => {
          if (result) {
            this.loadingService.hide();
            this.cargarHistoriales();
            this.cargarEstadisticas();
          }
        });
      return;
    }

    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { paciente_id: pacienteId },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.loadingService.hide();
          this.cargarHistoriales();
          this.cargarEstadisticas();
        }
      });
  }

  verHistorialDetalle(historial: any) {
    this.dialog.open(HistorialDetalleComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: historial,
    });
  }

  editarHistorial(historial: any) {
    const dialogRef = this.dialog.open(HistorialDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { historial, modoVer: false },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.cargarHistoriales();
          this.cargarEstadisticas();
        }
      });
  }

  async bajaLogicaHistorial(id: string) {
    // Obtener los datos del historial antes de dar de baja para registrar en el log
    this.historialesService
      .getHistorial(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (historial) => {
        if (historial) {
          const result = await Swal.fire({
            icon: 'warning',
            title: '¿Borrar este historial?',
            text: 'Se ocultará solo en el panel admin. El dueño seguirá viéndolo en la app a menos que marques "Ocultar del portal" al editar.',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar',
          });

          if (result.isConfirmed) {
            this.loadingService.show();
            try {
              await this.historialesService.bajaLogicaHistorial(id);
              this.pacientesService
                .registrarEliminacionHistorialClinico(historial.paciente_id, historial)
                .catch((err) => this.logger.error('Error al registrar eliminación en historial del paciente', err));
              this.cargarHistoriales();
              this.cargarEstadisticas();
              this.loadingService.hide();
              setTimeout(
                () => Swal.fire({ icon: 'success', title: 'Borrado', text: 'El historial ha sido borrado' }),
                0
              );
            } catch (error) {
              this.loadingService.hide();
              setTimeout(() => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo borrar el historial' }), 0);
            }
          }
        }
      });
  }

  async eliminarHistorial(id: string) {
    // Obtener los datos del historial antes de eliminarlo para registrar en el log
    this.historialesService
      .getHistorial(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (historial) => {
        if (historial) {
          const result = await Swal.fire({
            title: '¿Borrar este historial?',
            text: 'Se ocultará en admin y en el portal del dueño. Los datos se conservan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, borrar',
            cancelButtonText: 'Cancelar',
          });

          if (result.isConfirmed) {
            this.loadingService.show();
            try {
              await this.historialesService.eliminarHistorial(id);
              this.pacientesService
                .registrarEliminacionHistorialClinico(historial.paciente_id, historial)
                .catch((err) => this.logger.error('Error al registrar eliminación en historial del paciente', err));
              this.cargarHistoriales();
              this.cargarEstadisticas();
              this.loadingService.hide();
              setTimeout(
                () => Swal.fire({ icon: 'success', title: 'Borrado', text: 'Historial borrado correctamente.' }),
                0
              );
            } catch (error) {
              this.loadingService.hide();
              setTimeout(
                () =>
                  Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se pudo borrar el historial',
                  }),
                0
              );
            }
          }
        }
      });
  }

  async restaurarHistorial(id: string) {
    // Obtener los datos del historial antes de restaurarlo para registrar en el log
    this.historialesService
      .getHistorial(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (historial) => {
        if (historial) {
          const result = await Swal.fire({
            title: '¿Restaurar historial?',
            text: 'El historial será marcado como activo nuevamente.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, restaurar',
            cancelButtonText: 'Cancelar',
          });

          if (result.isConfirmed) {
            this.loadingService.show();
            try {
              await this.historialesService.restaurarHistorial(id);
              this.pacientesService
                .registrarHistorialClinico(historial.paciente_id, historial)
                .catch((err) => this.logger.error('Error al registrar historial clínico en paciente', err));
              this.cargarHistoriales();
              this.cargarEstadisticas();
              this.loadingService.hide();
              setTimeout(
                () =>
                  Swal.fire({
                    icon: 'success',
                    title: 'Restaurado',
                    text: 'El historial fue restaurado correctamente.',
                  }),
                0
              );
            } catch (error) {
              this.loadingService.hide();
              setTimeout(
                () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo restaurar el historial' }),
                0
              );
            }
          }
        }
      });
  }

  buscarHistoriales(texto: string) {
    if (texto.trim() === '') {
      this.cargarHistoriales();
      return;
    }

    this.historialesService
      .buscarHistoriales(texto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (historiales) => {
          this.dataSource.data = historiales.map((historial) => ({
            ...historial,
            paciente: this.pacientesMap[historial.paciente_id] || 'N/P',
            fecha_registro: this.formatearFecha(historial.fecha_registro),
          }));
        },
        error: (error) => {
          this.logger.error('Error en búsqueda:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error en Búsqueda',
            text: 'No se pudo realizar la búsqueda',
          });
        },
      });
  }

  /** Spec 022 — descontar stock ligado al historial (cirugía / consulta / vacuna). */
  consumirInventario(historial: any): void {
    if (!historial?.id) return;
    this.dialog.open(SalidaDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      disableClose: true,
      data: {
        historialId: historial.id,
        pacienteId: historial.paciente_id,
        pacienteNombre: historial.paciente || this.pacientesMap[historial.paciente_id] || '',
        motivoDefault: 'uso_consulta',
        hideRegistrarEnCaja: true,
        titulo: 'Consumir inventario',
        subtitulo: `Historial · ${historial.paciente || 'paciente'} · insumos de consulta/cirugía/vacuna`,
      },
    });
  }

  /** Spec 022 — cobrar con costo sugerido desde consumos o plantilla. */
  async registrarEnCaja(historial: any): Promise<void> {
    if (!historial?.id) return;
    if (bloquearCobroDirectoEnCaja(historial) || historial.visitaId) {
      Swal.fire({
        icon: 'info',
        title: 'Cobro en cuenta del día',
        text: historial.visitaId
          ? `Historial en ticket ${historial.visitaId}. Cobra desde Cuenta del día.`
          : 'Este historial ya fue cobrado.',
      });
      return;
    }
    this.loadingService.show(LOADING_MESSAGES.loading);
    let costoSugerido = 0;
    let movimientoIds: string[] = [];
    try {
      const consumos = await firstValueFrom(this.inventarioService.getMovimientosPorHistorial(historial.id));
      movimientoIds = (consumos || []).map((m) => m.id!).filter(Boolean);
      costoSugerido = this.inventarioService.sumarCostoConsumos(consumos || []);
    } catch (err) {
      this.logger.error('Error al leer consumos del historial:', err);
    } finally {
      this.loadingService.hide();
    }

    const pacienteNombre = historial.paciente || this.pacientesMap[historial.paciente_id] || 'paciente';
    const diag = String(historial.diagnostico_presuntivo || '').toLowerCase();
    let categoria: CajaCategoria = 'consulta';
    if (diag.includes('cirug') || diag.includes('qx') || diag.includes('esteriliz')) {
      categoria = 'cirugia';
    } else if (diag.includes('vacun')) {
      categoria = 'vacuna';
    }

    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        concepto: `Consulta · ${pacienteNombre}`,
        monto: 0,
        metodoPago: 'efectivo' as const,
        categoria,
        costoAsociado: costoSugerido > 0 ? costoSugerido : undefined,
        movimientoInventarioIds: movimientoIds.length ? movimientoIds : undefined,
        notas:
          costoSugerido > 0
            ? `Costo sugerido desde ${movimientoIds.length} consumo(s) de inventario`
            : 'Sin consumos de inventario; puedes elegir plantilla o capturar costo',
      },
    });

    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (result) => {
        const cajaId = result?.movimientoId as string | undefined;
        if (!cajaId || !movimientoIds.length) return;
        this.loadingService.show(LOADING_MESSAGES.updating);
        try {
          await Promise.all(movimientoIds.map((mid) => this.inventarioService.vincularMovimientoACaja(mid, cajaId)));
        } catch (error) {
          this.logger.error('Error al vincular consumos↔caja:', error);
          Swal.fire('Aviso', this.errorMessages.getUserMessage(error, 'vincular inventario a caja'), 'warning');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  /** Spec 040 — historial clínico → ticket del día. */
  async agregarAVisita(historial: any): Promise<void> {
    if (!historial?.id) return;
    if (historial.visitaId || historial.cobradaEnVisitaId || historial.cajaMovimientoId) {
      Swal.fire('info', 'Este historial ya está en un ticket o fue cobrado.', 'info');
      return;
    }
    const clienteId = historial.cliente_id || this.pacientesClienteMap[historial.paciente_id] || '';
    if (!clienteId) {
      Swal.fire('Falta cliente', 'No se pudo resolver el dueño del paciente.', 'warning');
      return;
    }
    const pacienteNombre = historial.paciente || this.pacientesMap[historial.paciente_id] || 'paciente';
    const monto = await promptMontoVisita(
      'Monto de la consulta',
      `¿Cuánto se cobrará por el historial de ${pacienteNombre}?`,
      0
    );
    if (monto == null || !(monto > 0)) return;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const diag = String(historial.diagnostico_presuntivo || 'consulta').slice(0, 60);
      const { visitaId } = await this.visitasService.agregarServicioAVisita({
        cliente_id: clienteId,
        paciente_id: historial.paciente_id,
        paciente: pacienteNombre,
        descripcion: `Consulta · ${pacienteNombre} · ${diag}`,
        monto,
        categoria: 'consulta',
        historialId: historial.id,
        fecha: String(historial.fecha_registro || '').slice(0, 10) || undefined,
      });
      const visita = await this.visitasService.getVisita(visitaId);
      this.dialog.open(VisitaDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        data: { visita: visita || undefined, cliente_id: clienteId },
      });
      Swal.fire({ icon: 'success', title: 'Agregado a visita', timer: 1400, showConfirmButton: false });
      this.cargarHistoriales();
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'agregar a visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }
}
