import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { formatearFechaLocalEs } from '../shared/datepicker/datepicker.util';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_CONFIG } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { CajaMovimientoDialogComponent } from '../finanzas/caja-movimiento-dialog.component';
import { DefaultsPensionService } from '../finanzas/defaults-pension.service';
import { SalidaDialogComponent } from '../inventario/movimientos/salida-dialog.component';
import { InventarioService } from '../inventario/inventario.service';
import { conceptoCajaPension, descripcionCobroPension } from './pension-cobro.util';
import { ESTADO_PENSION_LABELS, PensionEstancia, TAMANO_PENSION_LABELS } from './pension.models';
import { PensionDialogComponent } from './pension-dialog.component';
import { PensionService } from './pension.service';
import { VisitasService } from '../visitas/visitas.service';
import { VisitaDialogComponent } from '../visitas/visita-dialog.component';
import { promptMontoVisita } from '../visitas/visita-atalho.util';
import { coincidenciaTextoListado, listadoFechaIso } from '../core/utils/listado-hoy-manana.util';
import { ClasificadorAgenda, FiltroAgenda } from '../core/utils/agenda-filtros.util';
import { AgendaListadoState } from '../shared/admin/agenda-listado.state';

/**
 * Estancia en la agenda (2026-10-26):
 * - Reservada → fecha de ingreso; si ya pasó sin check-in, va en Atrasados.
 * - Activa → fecha de salida prevista; si ya pasó, Atrasados (falta check-out); si no, Hoy (está hospedada).
 * - Finalizada = hecha; pagada = en caja o cobrada en ticket.
 */
export const CLASIFICADOR_PENSION: ClasificadorAgenda<PensionEstancia> = {
  fechaIso: (r) => {
    if (r?.estado === 'reservada') return listadoFechaIso(r.fecha_ingreso);
    if (r?.estado === 'activa') return listadoFechaIso(r.fecha_salida_prevista);
    return listadoFechaIso(r?.fecha_salida_real || r?.fecha_salida_prevista, r?.fecha_ingreso);
  },
  esPendiente: (r) => r?.estado === 'reservada' || r?.estado === 'activa',
  esHecho: (r) => r?.estado === 'finalizada',
  esPagado: (r) => !!r?.cajaMovimientoId || !!r?.cobradaEnVisitaId,
  vaEnHoy: (r) => r?.estado === 'activa',
};

function pensionCoincideBusqueda(r: PensionEstancia, q: string): boolean {
  return coincidenciaTextoListado(
    [r.paciente, r.cliente, r.estado, r.fecha_ingreso, r.fecha_salida_prevista, r.fecha_salida_real, r.tamano_mascota],
    q
  );
}

@Component({
  selector: 'app-pension',
  templateUrl: './pension.component.html',
  styleUrls: ['./pension.component.scss'],
})
export class PensionComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['paciente', 'fechas', 'tamano', 'precio', 'estado', 'acciones'];
  /** Filtros de agenda: Pendientes (secciones) · Finalizadas · Por cobrar · Pagadas · Todas (2026-10-26). */
  readonly agenda = new AgendaListadoState<PensionEstancia>(CLASIFICADOR_PENSION, pensionCoincideBusqueda, {
    hechos: 'Finalizadas',
    pagados: 'Pagadas',
    todos: 'Todas',
  });

  /** Lista plana (Finalizadas, Por cobrar, Pagadas, Todas o búsqueda). */
  get dataSource(): MatTableDataSource<PensionEstancia> {
    return this.agenda.plana;
  }
  private todasFilas: PensionEstancia[] = [];
  buscarTexto = '';
  tablaInicializada = false;
  loading = true;
  menuContext: PensionEstancia | null = null;

  get modoBusqueda(): boolean {
    return !!this.buscarTexto.trim();
  }

  get vistaSecciones(): boolean {
    return this.agenda.vistaSecciones(this.buscarTexto);
  }

  get tituloListaPlana(): string {
    return this.agenda.tituloPlana(this.buscarTexto);
  }

  get listadoMeta(): string {
    if (this.loading || !this.todasFilas.length) return '';
    if (this.vistaSecciones) {
      return `Pendientes · ${this.agenda.cuentas.pendientes || 0}`;
    }
    return `${this.tituloListaPlana} · ${this.dataSource.data.length}`;
  }

  get todasFilasTieneDatos(): boolean {
    return this.todasFilas.length > 0;
  }

  get listaPlanaVacia(): boolean {
    return !this.loading && this.todasFilas.length > 0 && !this.dataSource.data.length;
  }

  trackSeccion(_: number, s: { id: string }): string {
    return s.id;
  }

  /** `irALista`: desde una tarjeta de números (abajo), sube a la lista. */
  cambiarFiltroAgenda(filtro: FiltroAgenda, irALista = false): void {
    this.agenda.filtro = filtro;
    this.aplicarVistaListado();
    if (irALista) {
      setTimeout(() => document.querySelector('.agenda-filtros-wrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  readonly estadoLabels = ESTADO_PENSION_LABELS;
  readonly tamanoLabels = TAMANO_PENSION_LABELS;

  totalActivas = 0;
  totalReservadas = 0;
  totalFinalizadas = 0;
  ocupacionVisible = 0;
  valorEstimado = 0;

  constructor(
    private pensionService: PensionService,
    private defaultsPension: DefaultsPensionService,
    private inventarioService: InventarioService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService,
    private visitasService: VisitasService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargar(): void {
    this.loading = true;
    this.pensionService
      .getEstancias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.todasFilas = rows || [];
          this.totalActivas = this.todasFilas.filter((r) => r.estado === 'activa').length;
          this.totalReservadas = this.todasFilas.filter((r) => r.estado === 'reservada').length;
          this.totalFinalizadas = this.todasFilas.filter((r) => r.estado === 'finalizada').length;
          this.ocupacionVisible = this.totalActivas;
          this.valorEstimado = this.todasFilas
            .filter((r) => r.estado === 'activa' || r.estado === 'reservada')
            .reduce((sum, r) => sum + (Number(r.precio_total) || 0), 0);
          this.aplicarVistaListado();
          this.tablaInicializada = true;
          this.loading = false;
        },
        error: (error) => {
          this.logger.error('Error al cargar pensión:', error);
          this.loading = false;
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar pensión'), 'error');
        },
      });
  }

  applyFilter(event: Event): void {
    this.buscarTexto = (event.target as HTMLInputElement).value || '';
    this.aplicarVistaListado();
  }

  /** Pendientes por secciones (default) o lista filtrada / búsqueda (2026-10-26). */
  private aplicarVistaListado(): void {
    this.agenda.aplicar(this.todasFilas, this.buscarTexto);
    if (this.vistaSecciones) return;
    setTimeout(() => {
      if (this.paginator) {
        this.dataSource.paginator = this.paginator;
        this.paginator.firstPage();
      }
    });
  }

  diasEstancia(row: PensionEstancia): number {
    return this.pensionService.calcularDias(row.fecha_ingreso, row.fecha_salida_real || row.fecha_salida_prevista);
  }

  estadoClass(estado: string): string {
    switch (estado) {
      case 'activa':
        return 'estado-badge--activa';
      case 'reservada':
        return 'estado-badge--reservada';
      case 'finalizada':
        return 'estado-badge--finalizada';
      case 'cancelada':
        return 'estado-badge--cancelada';
      default:
        return '';
    }
  }

  /** Tarjeta de celular (spec 096): una acción visible según el estado de la estancia. */
  accionPrincipalPension(row: PensionEstancia): { tipo: 'ingreso' | 'salida' | 'cobrar' | 'editar'; label: string; icon: string } {
    if (this.puedeCheckIn(row)) return { tipo: 'ingreso', label: 'Registrar ingreso', icon: 'login' };
    if (this.puedeCheckOut(row)) return { tipo: 'salida', label: 'Registrar salida', icon: 'logout' };
    if (this.puedeCobrar(row)) return { tipo: 'cobrar', label: 'Agregar al ticket', icon: 'receipt_long' };
    return { tipo: 'editar', label: 'Editar', icon: 'edit' };
  }

  ejecutarAccionPension(row: PensionEstancia, event?: Event): void {
    event?.stopPropagation();
    switch (this.accionPrincipalPension(row).tipo) {
      case 'ingreso':
        void this.checkIn(row);
        return;
      case 'salida':
        void this.checkOut(row);
        return;
      case 'cobrar':
        void this.agregarAVisita(row);
        return;
      default:
        this.editar(row);
    }
  }

  /** Fecha legible en tarjetas (dd/mm/aaaa) sin voltear día/mes. */
  fechaCorta(valor: unknown): string {
    return formatearFechaLocalEs(valor) || String(valor || '');
  }

  puedeCheckIn(row: PensionEstancia): boolean {
    return row.estado === 'reservada';
  }

  puedeCheckOut(row: PensionEstancia): boolean {
    return row.estado === 'activa';
  }

  puedeCobrar(row: PensionEstancia): boolean {
    return (
      !row.cajaMovimientoId &&
      !row.visitaId &&
      !row.cobradaEnVisitaId &&
      (row.estado === 'activa' || row.estado === 'finalizada')
    );
  }

  nueva(): void {
    const ref = this.dialog.open(PensionDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      disableClose: true,
      data: {},
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
  }

  editar(estancia: PensionEstancia): void {
    const ref = this.dialog.open(PensionDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '720px',
      disableClose: true,
      data: { estancia },
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe();
  }

  async checkIn(estancia: PensionEstancia): Promise<void> {
    if (!estancia?.id || !this.puedeCheckIn(estancia)) return;
    const confirm = await Swal.fire({
      title: '¿Check-in?',
      text: `${estancia.paciente || 'Paciente'} pasa a alojamiento activo.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, check-in',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.updating);
    try {
      await this.pensionService.actualizarEstancia(estancia.id, { estado: 'activa' });
      Swal.fire({ icon: 'success', title: 'Check-in listo', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'check-in pensión'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  async checkOut(estancia: PensionEstancia): Promise<void> {
    if (!estancia?.id || !this.puedeCheckOut(estancia)) return;
    const hoy = new Date().toISOString().slice(0, 10);
    const confirm = await Swal.fire({
      title: '¿Check-out?',
      html: `${estancia.paciente || 'Paciente'} sale hoy (${hoy}).<br>Puedes cobrar en caja después.`,
      icon: 'question',
      showCancelButton: true,
      showDenyButton: !estancia.cajaMovimientoId,
      confirmButtonText: 'Solo check-out',
      denyButtonText: 'Check-out y cobrar',
      cancelButtonText: 'Cancelar',
    });
    if (confirm.isDismissed) return;

    this.loadingService.show(LOADING_MESSAGES.updating);
    try {
      await this.pensionService.actualizarEstancia(estancia.id, {
        estado: 'finalizada',
        fecha_salida_real: hoy,
      });
      this.loadingService.hide();
      if (confirm.isDenied) {
        await this.registrarEnCaja({
          ...estancia,
          estado: 'finalizada',
          fecha_salida_real: hoy,
        });
      } else {
        Swal.fire({ icon: 'success', title: 'Check-out listo', timer: 1400, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'check-out pensión'), 'error');
      this.loadingService.hide();
    }
  }

  async registrarEnCaja(estancia: PensionEstancia): Promise<void> {
    if (!estancia?.id) return;
    if (estancia.cajaMovimientoId) {
      Swal.fire({
        icon: 'info',
        title: 'Ya vinculado a caja',
        text: `Esta estancia ya tiene movimiento ${estancia.cajaMovimientoId}.`,
      });
      return;
    }
    if (estancia.visitaId) {
      Swal.fire({
        icon: 'info',
        title: 'Cobro en cuenta del día',
        text: `Estancia en ticket ${estancia.visitaId}. Cobra desde Cuenta del día.`,
      });
      return;
    }

    let movimientoInventarioIds: string[] = [];
    let costoExtraComida = 0;

    const defaults = await this.defaultsPension.getDefaultsOnce().catch(() => null);
    const row =
      estancia.tamano_mascota && defaults
        ? this.defaultsPension.defaultParaTamano(defaults, estancia.tamano_mascota)
        : null;

    if (row?.productoComidaId) {
      const dias = this.pensionService.calcularDias(
        estancia.fecha_ingreso,
        estancia.fecha_salida_prevista || estancia.fecha_salida_real
      );
      const qty = Math.max(1, Math.round((row.cantidadComidaPorDia || 1) * dias));
      const confirmComida = await Swal.fire({
        icon: 'question',
        title: '¿Descontar comida del inventario?',
        text: `Producto configurado en defaults · ${qty} unidad(es) aprox. (${dias} día(s)).`,
        showCancelButton: true,
        confirmButtonText: 'Sí, descontar',
        cancelButtonText: 'No, solo cobrar',
      });
      if (confirmComida.isConfirmed) {
        const salidaRef = this.dialog.open(SalidaDialogComponent, {
          ...ADMIN_DIALOG_CONFIG,
          width: '720px',
          disableClose: true,
          data: {
            pacienteId: estancia.paciente_id !== 'manual' ? estancia.paciente_id : undefined,
            pacienteNombre: estancia.paciente,
            motivoDefault: 'uso_consulta',
            hideRegistrarEnCaja: true,
            productoId: row.productoComidaId,
            cantidad: qty,
            observaciones: `Comida pensión · ${estancia.paciente || ''}`,
            titulo: 'Consumo comida pensión',
            subtitulo: 'Opt-in al cobrar estancia',
          },
        });
        const salidaResult = await firstValueFrom(salidaRef.afterClosed());
        if (salidaResult?.ok && salidaResult.movimientoId) {
          movimientoInventarioIds = [salidaResult.movimientoId];
          try {
            const movs = await firstValueFrom(this.inventarioService.getTodosLosMovimientos());
            const m = (movs || []).find((x) => x.id === salidaResult.movimientoId);
            costoExtraComida = Number(m?.costo_total) || 0;
          } catch {
            /* ignore */
          }
        }
      }
    }

    const costoBase = estancia.costo_total_estimado != null ? Number(estancia.costo_total_estimado) : undefined;
    const costoAsociado =
      costoBase != null || costoExtraComida > 0
        ? Math.round(((costoBase || 0) + costoExtraComida) * 100) / 100
        : undefined;

    const ref = this.dialog.open(CajaMovimientoDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      width: '640px',
      disableClose: true,
      data: {
        fechaDefault: estancia.fecha_ingreso,
        concepto: conceptoCajaPension(estancia),
        monto: Number(estancia.precio_total) || Number(estancia.precio_dia) || 0,
        metodoPago: 'efectivo' as const,
        categoria: 'pension' as const,
        costoAsociado,
        movimientoInventarioIds: movimientoInventarioIds.length ? movimientoInventarioIds : undefined,
        notas: estancia.notas || '',
      },
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (result) => {
        const id = result?.movimientoId as string | undefined;
        if (!result?.ok || !id) return;
        this.loadingService.show(LOADING_MESSAGES.updating);
        try {
          const hoy = new Date().toISOString().slice(0, 10);
          await this.pensionService.actualizarEstancia(estancia.id!, {
            cajaMovimientoId: id,
            estado: 'finalizada',
            fecha_salida_real: estancia.fecha_salida_real || hoy,
          });
          if (movimientoInventarioIds.length) {
            await Promise.all(
              movimientoInventarioIds.map((mid) => this.inventarioService.vincularMovimientoACaja(mid, id))
            );
          }
        } catch (error) {
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'vincular pensión a caja'), 'error');
        } finally {
          this.loadingService.hide();
        }
      });
  }

  /** Spec 040 — pensión sin cobro → ticket del día. */
  async agregarAVisita(estancia: PensionEstancia): Promise<void> {
    if (!estancia?.id) return;
    if (estancia.cajaMovimientoId || estancia.visitaId || estancia.cobradaEnVisitaId) {
      Swal.fire('info', 'Esta estancia ya está cobrada o en un ticket.', 'info');
      return;
    }
    if (!estancia.cliente_id) {
      Swal.fire('Falta cliente', 'La estancia necesita cliente_id.', 'warning');
      return;
    }
    let monto = Number(estancia.precio_total) || Number(estancia.precio_dia) || 0;
    monto =
      (await promptMontoVisita('Monto de pensión', '¿Cuánto se cobrará por esta estancia en el ticket?', monto)) ?? 0;
    if (!(monto > 0)) return;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const { visitaId } = await this.visitasService.agregarServicioAVisita({
        cliente_id: estancia.cliente_id,
        cliente: estancia.cliente,
        paciente_id: estancia.paciente_id !== 'manual' ? estancia.paciente_id : undefined,
        paciente: estancia.paciente,
        descripcion: descripcionCobroPension(estancia),
        monto,
        categoria: 'pension',
        pensionId: estancia.id,
        fecha: estancia.fecha_ingreso,
      });
      const visita = await this.visitasService.getVisita(visitaId);
      this.dialog.open(VisitaDialogComponent, {
        ...ADMIN_DIALOG_CONFIG,
        width: '720px',
        data: { visita: visita || undefined },
      });
      Swal.fire({ icon: 'success', title: 'Agregada a visita', timer: 1400, showConfirmButton: false });
      this.cargar();
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'agregar a visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  async borrar(estancia: PensionEstancia): Promise<void> {
    if (!estancia.id) return;
    const confirm = await Swal.fire({
      title: '¿Borrar esta estancia?',
      text: `${estancia.paciente || 'Paciente'} · ${estancia.fecha_ingreso}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
    });
    if (!confirm.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.pensionService.bajaLogicaEstancia(estancia.id);
      Swal.fire({ icon: 'success', title: 'Borrado', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar pensión'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  formatMoney(n: number | undefined): string {
    return `$${(Number(n) || 0).toFixed(0)}`;
  }
}
