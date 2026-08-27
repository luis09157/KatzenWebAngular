import { Component, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { ADMIN_DIALOG_FORM } from '../core/config/admin-ui.config';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { LoggerService } from '../core/logger.service';
import { BaniosService } from '../banios/banios.service';
import { CitasService } from '../citas/citas.service';
import { ClientesService } from '../clientes/clientes.service';
import { HistorialesService } from '../historiales/historiales.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { PensionService } from '../pension/pension.service';
import { VacunasService } from '../vacunas/vacunas.service';
import { Visita, VISITA_ESTADO_LABELS } from './visitas.models';
import { VisitasService } from './visitas.service';
import { calcularVisitaKpis, hoyLocalIsoDate } from './visitas.util';
import { VisitaDialogComponent } from './visita-dialog.component';
import { PorCobrarItem } from './por-cobrar-hoy.models';
import { buildPorCobrarHoy, totalPorCobrarHoy } from './por-cobrar-hoy.util';
import { promptMontoVisita } from './visita-atalho.util';

export type VisitasFiltroRapido = 'todas' | 'hoy' | 'abiertas' | 'deudas' | 'por_cobrar';

@Component({
  selector: 'app-visitas',
  templateUrl: './visitas.component.html',
  styleUrls: ['./visitas.component.scss']
})
export class VisitasComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  readonly pageSize = 50;

  displayedColumns = ['fecha', 'cliente', 'totales', 'estado', 'acciones'];
  dataSource = new MatTableDataSource<Visita>([]);
  loading = true;
  filtroRapido: VisitasFiltroRapido = 'todas';
  private allRows: Visita[] = [];
  private textoFiltro = '';

  visitasHoy = 0;
  abiertas = 0;
  parciales = 0;
  conSaldoCount = 0;
  saldoPorCobrar = 0;
  cerradasHoy = 0;
  porCobrarItems: PorCobrarItem[] = [];
  porCobrarTotal = 0;
  porCobrarColumns = ['tipo', 'cliente', 'descripcion', 'monto', 'acciones'];

  readonly estadoLabels = VISITA_ESTADO_LABELS;
  private clientesMap: Record<string, string> = {};
  private pacientesClienteMap: Record<string, { cliente_id: string; nombre?: string }> = {};

  constructor(
    private visitasService: VisitasService,
    private baniosService: BaniosService,
    private citasService: CitasService,
    private pensionService: PensionService,
    private vacunasService: VacunasService,
    private historialesService: HistorialesService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.dataSource.filterPredicate = (row, filter) => {
      const q = filter.trim().toLowerCase();
      if (!q) return true;
      return (
        String(row.cliente || '').toLowerCase().includes(q) ||
        String(row.paciente || '').toLowerCase().includes(q) ||
        String(row.fecha || '').includes(q) ||
        String(row.estado || '').toLowerCase().includes(q)
      );
    };
    this.cargar();
    this.cargarPorCobrarHoy();
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
    this.visitasService
      .getVisitas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.allRows = rows || [];
          const kpis = calcularVisitaKpis(this.allRows, hoyLocalIsoDate());
          this.visitasHoy = kpis.visitasHoy;
          this.abiertas = kpis.abiertas;
          this.parciales = kpis.parciales;
          this.conSaldoCount = this.allRows.filter(
            (v) => (Number(v.saldo) || 0) > 0 && v.estado !== 'cancelada'
          ).length;
          this.saldoPorCobrar = kpis.saldoPorCobrar;
          this.cerradasHoy = kpis.cerradasHoy;
          this.applyFilters();
          this.loading = false;
          setTimeout(() => {
            if (this.paginator) this.dataSource.paginator = this.paginator;
          }, 0);
        },
        error: (error) => {
          this.logger.error('Error al cargar visitas:', error);
          this.loading = false;
          Swal.fire('Error', this.errorMessages.getUserMessage(error, 'cargar visitas'), 'error');
        }
      });
  }

  setFiltroRapido(f: VisitasFiltroRapido): void {
    this.filtroRapido = this.filtroRapido === f && f !== 'todas' ? 'todas' : f;
    this.applyFilters();
  }

  applyFilters(): void {
    const hoy = hoyLocalIsoDate();
    let base = this.allRows;
    switch (this.filtroRapido) {
      case 'hoy':
        base = base.filter((v) => v.fecha === hoy);
        break;
      case 'abiertas':
        base = base.filter((v) => v.estado === 'abierta' || v.estado === 'parcial');
        break;
      case 'deudas':
        base = base.filter((v) => (Number(v.saldo) || 0) > 0);
        break;
      case 'por_cobrar':
        base = base.filter(
          (v) =>
            v.fecha === hoy &&
            (Number(v.saldo) || 0) > 0 &&
            v.estado !== 'cancelada' &&
            v.estado !== 'cerrada'
        );
        break;
      default:
        break;
    }
    this.dataSource.data = base;
    this.dataSource.filter = this.textoFiltro;
  }

  applyFilter(event: Event): void {
    this.textoFiltro = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.dataSource.filter = this.textoFiltro;
  }

  formatMoney(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0);
  }

  estadoClass(estado: string): string {
    switch (estado) {
      case 'cerrada':
        return 'activo';
      case 'parcial':
        return 'warning';
      case 'cancelada':
        return 'inactivo';
      default:
        return 'pendiente';
    }
  }

  private cargarPorCobrarHoy(): void {
    combineLatest([
      this.visitasService.getVisitas(),
      this.baniosService.getBanios(),
      this.citasService.getCitas(),
      this.pensionService.getEstancias(),
      this.vacunasService.getVacunas(),
      this.historialesService.getHistoriales(),
      this.clientesService.getClientes(),
      this.pacientesService.getPacientes()
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([visitas, banios, citas, pensiones, vacunas, historiales, clientes, pacientes]) => {
          this.clientesMap = {};
          (clientes || []).forEach((c: any) => {
            if (c?.id) this.clientesMap[c.id] = c.nombre || c.nombre_completo || '';
          });
          this.pacientesClienteMap = {};
          (pacientes || []).forEach((p: any) => {
            if (!p?.id) return;
            const cid = p.cliente_id || p.idCliente || '';
            this.pacientesClienteMap[p.id] = {
              cliente_id: cid,
              nombre: p.nombre
            };
          });
          const hoy = hoyLocalIsoDate();
          this.porCobrarItems = buildPorCobrarHoy({
            hoy,
            visitas: visitas || [],
            banios: banios || [],
            citas: citas || [],
            pensiones: pensiones || [],
            vacunas: vacunas || [],
            historiales: historiales || [],
            clientesMap: this.clientesMap,
            pacientesClienteMap: this.pacientesClienteMap
          });
          this.porCobrarTotal = totalPorCobrarHoy(this.porCobrarItems);
        },
        error: (err) => this.logger.error('Por cobrar hoy:', err)
      });
  }

  tipoPorCobrarLabel(tipo: string): string {
    const map: Record<string, string> = {
      visita: 'Ticket',
      banio: 'Baño',
      cita: 'Cita',
      pension: 'Pensión',
      vacuna: 'Vacuna',
      historial: 'Historial'
    };
    return map[tipo] || tipo;
  }

  async accionPorCobrar(item: PorCobrarItem): Promise<void> {
    if (item.accion === 'abrir_ticket' && item.visitaId) {
      const visita = await this.visitasService.getVisita(item.visitaId);
      if (visita) {
        this.editar(visita);
      }
      return;
    }
    let monto = item.monto;
    if (!(monto > 0)) {
      monto =
        (await promptMontoVisita(
          'Monto del servicio',
          `¿Cuánto se cobrará por ${item.descripcion}?`,
          0
        )) ?? 0;
      if (!(monto > 0)) return;
    }
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      const cat =
        item.tipo === 'banio'
          ? 'banio'
          : item.tipo === 'pension'
            ? 'pension'
            : item.tipo === 'vacuna'
              ? 'vacuna'
              : item.tipo === 'historial'
                ? 'consulta'
                : 'consulta';
      const opts: Parameters<VisitasService['agregarServicioAVisita']>[0] = {
        cliente_id: item.cliente_id,
        cliente: item.cliente,
        paciente_id: item.paciente_id,
        paciente: item.paciente,
        descripcion: item.descripcion,
        monto,
        categoria: cat as any,
        fecha: item.fecha
      };
      if (item.tipo === 'banio') opts.banioId = item.id;
      if (item.tipo === 'cita') opts.citaId = item.id;
      if (item.tipo === 'pension') opts.pensionId = item.id;
      if (item.tipo === 'vacuna') opts.vacunaId = item.id;
      if (item.tipo === 'historial') opts.historialId = item.id;

      const { visitaId } = await this.visitasService.agregarServicioAVisita(opts);
      const visita = await this.visitasService.getVisita(visitaId);
      this.dialog.open(VisitaDialogComponent, {
        ...ADMIN_DIALOG_FORM,
        data: { visita: visita || undefined, cliente_id: item.cliente_id, cliente: item.cliente }
      });
      Swal.fire({ icon: 'success', title: 'Agregado al ticket', timer: 1400, showConfirmButton: false });
      this.cargar();
      this.cargarPorCobrarHoy();
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'agregar a visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  nueva(): void {
    const ref = this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: {}
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  editar(row: Visita): void {
    const ref = this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { visita: row }
    });
    ref.afterClosed().pipe(takeUntil(this.destroy$)).subscribe((r) => {
      if (r) this.cargar();
    });
  }

  async borrar(row: Visita): Promise<void> {
    if (!row.id) return;
    const conf = await Swal.fire({
      icon: 'warning',
      title: '¿Borrar visita?',
      text: 'Se cancela el ticket. El historial de caja no se elimina.',
      showCancelButton: true,
      confirmButtonText: 'Borrar',
      cancelButtonText: 'Cancelar'
    });
    if (!conf.isConfirmed) return;
    this.loadingService.show(LOADING_MESSAGES.deleting);
    try {
      await this.visitasService.bajaLogicaVisita(row.id);
      Swal.fire({ icon: 'success', title: 'Visita borrada', timer: 1400, showConfirmButton: false });
    } catch (error) {
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'borrar visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }
}
