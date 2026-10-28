import { Component, Injector, OnDestroy, OnInit, inject } from '@angular/core';
import { Subject, Subscription, combineLatest } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CitasService } from '../citas/citas.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { CitasDiaDialogComponent } from './citas-dia-dialog.component';
import {
  ADMIN_DIALOG_DETAIL,
  ADMIN_DIALOG_CONFIRM,
  ADMIN_DIALOG_FORM,
  ADMIN_DIALOG_CONFIG,
} from '../core/config/admin-ui.config';
import { OwnerDashboardService } from './owner-dashboard.service';
import { OwnerDashboardSnapshot } from './owner-dashboard.models';
import { InversionMetaProgress } from '../core/models/clinic-config.model';
import { InversionMetaDialogComponent } from './inversion-meta-dialog.component';
import { PeriodoPreset, formatMoneyMx, formatLabelEs } from '../core/utils/periodo-filtro.util';
import { LoggerService } from '../core/logger.service';
import { BaniosService } from '../banios/banios.service';
import { HistorialesService } from '../historiales/historiales.service';
import { PensionService } from '../pension/pension.service';
import { VacunasService } from '../vacunas/vacunas.service';
import { VisitasService } from '../visitas/visitas.service';
import { PorCobrarItem } from '../visitas/por-cobrar-hoy.models';
import { buildPorCobrarHoy, totalPorCobrarHoy } from '../visitas/por-cobrar-hoy.util';
import { hoyLocalIsoDate } from '../visitas/visitas.util';
import { VisitaDialogComponent } from '../visitas/visita-dialog.component';
import { promptMontoVisita } from '../visitas/visita-atalho.util';
import { LoadingService, LOADING_MESSAGES } from '../core/loading.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import { abrirAltaRapidaDialog } from '../alta-rapida/alta-rapida-dialog.component';
import { TOOLTIP_ATENDER_SIN_PACIENTE, puedeAtenderCita, pacienteIdDeCita } from '../citas/cita-atender.util';
import { CitaDialogComponent } from '../citas/cita-dialog.component';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { staffRoleCanAccessModule, staffRoleSeesOwnerDashboard } from '../core/config/staff-role.config';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { InventarioService } from '../inventario/inventario.service';
import { esEstanciaPensionHoy, esRecordatorioHoyOVencido } from './hoy-operacion.util';
import {
  AgendaEventoDia,
  AgendaEventoTipo,
  BanioCalendarioLike,
  CalendarioDiaCell,
  CitaCalendarioLike,
  PensionCalendarioLike,
  buildBaniosMapByDate,
  buildCalendarioMesDays,
  buildCitasMapByDate,
  etiquetaAgendaTipo,
  eventosAgendaDelDia,
  isoKeyFromLocalDate,
  labelDiaSeleccionado,
} from './dashboard-calendario.util';
import {
  buildMensajeWhatsappRecordatorio,
  buildTelUrl,
  buildWhatsappUrl,
  normalizarTelefonoMx,
} from '../recordatorios/recordatorio-whatsapp.util';
import { getPacienteClienteId } from '../core/utils/paciente-cliente.util';
import KatzenSwal from '../core/ui/katzen-swal';
import { pendientesDeDiasPasados } from '../cierre-dia/cierre-dia.util';
import { abrirCierreDia } from '../cierre-dia/cierre-dia.launcher';
import { abrirParaAvisar } from '../para-avisar/para-avisar.launcher';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [style({ opacity: 0 }), animate('250ms', style({ opacity: 1 }))]),
    ]),
  ],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private ownerSub?: Subscription;
  breadcrumbs: Array<{ label: string; url: string }> = [];
  selectedDate = new Date();
  calendarDays: CalendarioDiaCell[] = [];
  citas: CitaCalendarioLike[] = [];
  citasMap: Record<string, CitaCalendarioLike[]> = {};
  baniosMap: Record<string, BanioCalendarioLike[]> = {};
  estanciasCalendario: PensionCalendarioLike[] = [];
  selectedDayIso = hoyLocalIsoDate();
  selectedDayCitas: CitaCalendarioLike[] = [];
  selectedDayEventos: AgendaEventoDia[] = [];
  selectedDayDate: Date | null = new Date();
  clientesMap: { [id: string]: string } = {};
  pacientesMap: { [id: string]: string } = {};
  monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  loading = false;
  ownerLoading = false;

  get calendarioDiaLabel(): string {
    return labelDiaSeleccionado(this.selectedDayIso, hoyLocalIsoDate());
  }

  get calendarioDiaDesc(): string {
    const n = this.selectedDayEventos.length;
    if (!n) return 'Nadie en agenda este día';
    return n === 1 ? '1 en la agenda' : `${n} en la agenda`;
  }

  /** Spec 025 — filtros dashboard dueño */
  periodoPreset: PeriodoPreset = 'este_mes';
  desdeCustom = '';
  hastaCustom = '';
  snap: OwnerDashboardSnapshot | null = null;
  inversionMeta: InversionMetaProgress | null = null;
  readonly presets: Array<{ id: PeriodoPreset; label: string }> = [
    { id: 'este_mes', label: 'Este mes' },
    { id: 'mes_anterior', label: 'Mes anterior' },
    { id: '30d', label: '30 días' },
    { id: '60d', label: '60 días' },
  ];

  /** Hub recepción (spec 049) */
  porCobrarItems: PorCobrarItem[] = [];
  porCobrarTotal = 0;
  /** Etapa A — baños, citas y tickets de días pasados que siguen abiertos. */
  pendientesPasados = 0;
  /** Spec 111 — clientes para avisar hoy (WhatsApp con autorización de la vet). */
  paraAvisar = 0;
  private readonly injectorParaAvisar = inject(Injector);
  porCobrarColumns = ['tipo', 'cliente', 'descripcion', 'monto', 'acciones'];
  citasHoyCount = 0;
  citasHoy: CitaCalendarioLike[] = [];
  readonly tooltipAtenderSinPaciente = TOOLTIP_ATENDER_SIN_PACIENTE;
  verOwnerDash = false;
  /** Botón rápido «Pacientes»: directorio si el rol lo tiene; si no, búsqueda de expediente. */
  rutaPacientes = '/admin/paciente';
  verStockBajo = false;
  recordatoriosHoy: Array<{
    id: string;
    titulo: string;
    paciente: string;
    cliente: string;
    fecha: string;
    whatsappUrl: string;
    telUrl: string;
    whatsappTel: string | null;
  }> = [];
  pensionHoy: Array<{ id?: string; paciente?: string; cliente?: string; fecha_ingreso?: string }> = [];
  stockBajoCount = 0;
  private clientesMapHub: Record<string, string> = {};
  private pacientesClienteMapHub: Record<string, { cliente_id: string; nombre?: string }> = {};

  get serieMax(): number {
    if (!this.snap?.serieIngresos?.length) return 1;
    return Math.max(1, ...this.snap.serieIngresos.map((p) => p.ingresos));
  }

  get chartPoints(): string {
    const serie = this.snap?.serieIngresos || [];
    if (serie.length < 2) return '';
    const max = this.serieMax;
    const w = 100;
    const h = 100;
    return serie
      .map((p, i) => {
        const x = (i / (serie.length - 1)) * w;
        const y = h - (p.ingresos / max) * (h * 0.85) - h * 0.05;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  }

  get chartAreaPoints(): string {
    const line = this.chartPoints;
    if (!line) return '';
    return `0,100 ${line} 100,100`;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private citasService: CitasService,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private dialog: MatDialog,
    private ownerDashboard: OwnerDashboardService,
    private logger: LoggerService,
    private baniosService: BaniosService,
    private visitasService: VisitasService,
    private pensionService: PensionService,
    private vacunasService: VacunasService,
    private historialesService: HistorialesService,
    private loadingService: LoadingService,
    private errorMessages: ErrorMessagesService,
    private authProfile: AuthProfileService,
    private recordatoriosService: RecordatoriosService,
    private inventarioService: InventarioService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    void this.authProfile.getEffectiveStaffRole().then((role) => {
      this.verOwnerDash = staffRoleSeesOwnerDashboard(role);
      this.rutaPacientes = staffRoleCanAccessModule(role, 'pacientes-admin')
        ? '/admin/pacientes-admin'
        : '/admin/paciente';
      this.verStockBajo = this.verOwnerDash;
      if (this.verOwnerDash) {
        this.cargarOwnerDashboard();
        this.cargarInversionMeta();
        this.cargarStockBajo();
      }
    });
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.breadcrumbs = this.buildBreadcrumbs(this.route.root);
      });
    this.loadClientesYPacientes();
    this.loadCitas();
    this.loadAgendaPeluqueriaYPension();
    this.generateCalendar();
    this.cargarPorCobrarHoy();
    void this.contarParaAvisar();
    this.cargarRecordatoriosHoy();
    this.cargarPensionHoy();
  }

  ngOnDestroy(): void {
    this.ownerSub?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  setPreset(preset: PeriodoPreset): void {
    this.periodoPreset = preset;
    if (preset !== 'custom') {
      this.cargarOwnerDashboard();
    }
  }

  aplicarRangoCustom(): void {
    if (!this.desdeCustom || !this.hastaCustom) return;
    this.periodoPreset = 'custom';
    this.cargarOwnerDashboard();
  }

  cargarInversionMeta(): void {
    this.ownerDashboard
      .inversionMetaProgress$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (p) => (this.inversionMeta = p),
        error: (err) => this.logger.error('Error meta inversión:', err),
      });
  }

  abrirConfigMeta(): void {
    const ref = this.dialog.open(InversionMetaDialogComponent, {
      ...ADMIN_DIALOG_CONFIRM,
      data: { montoMeta: this.inversionMeta?.montoMeta },
    });
    ref
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result?.saved) this.cargarInversionMeta();
      });
  }

  cargarOwnerDashboard(): void {
    this.ownerLoading = true;
    this.ownerSub?.unsubscribe();
    this.ownerSub = this.ownerDashboard
      .snapshot$(this.periodoPreset, this.desdeCustom || undefined, this.hastaCustom || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (snap) => {
          this.snap = snap;
          this.ownerLoading = false;
        },
        error: (err) => {
          this.logger.error('Error dashboard dueño:', err);
          this.ownerLoading = false;
        },
      });
  }

  formatMoney(n: number | undefined | null): string {
    return formatMoneyMx(n, 2);
  }

  formatChartFecha(iso: string): string {
    const d = new Date(iso + 'T12:00:00');
    if (isNaN(d.getTime())) return iso.slice(5);
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  barPct(value: number): number {
    return Math.min(100, Math.round((Math.abs(value) / this.serieMax) * 100));
  }

  rangoLabel(): string {
    if (!this.snap) return '';
    return `Mostrando datos del ${formatLabelEs(this.snap.rango.desde)} al ${formatLabelEs(this.snap.rango.hasta)}`;
  }

  nuevaVentaMostrador(): void {
    this.dialog.open(VisitaDialogComponent, {
      ...ADMIN_DIALOG_FORM,
      data: { esMostrador: true },
    });
  }

  llegoUnPaciente(): void {
    abrirAltaRapidaDialog(this.dialog);
  }

  puedeAtender(cita: { paciente_id?: string; idPaciente?: string } | null): boolean {
    return puedeAtenderCita(cita);
  }

  private cargarRecordatoriosHoy(): void {
    combineLatest([
      this.recordatoriosService.getRecordatorios(),
      this.clientesService.getClientes(),
      this.pacientesService.getPacientes(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([recs, clientes, pacientes]) => {
          const hoy = hoyLocalIsoDate();
          const clientesById: Record<string, { nombre?: string; telefono?: string }> = {};
          (clientes || []).forEach(
            (c: { id?: string; nombre?: string; nombre_completo?: string; telefono?: string }) => {
              if (c?.id) clientesById[c.id] = { nombre: c.nombre || c.nombre_completo, telefono: c.telefono };
            }
          );
          const pacientesById: Record<string, { nombre?: string; cliente_id?: string; idCliente?: string }> = {};
          (pacientes || []).forEach((p: { id?: string; nombre?: string; cliente_id?: string; idCliente?: string }) => {
            if (p?.id) pacientesById[p.id] = p;
          });
          this.recordatoriosHoy = (recs || [])
            .filter((r: Record<string, unknown>) => esRecordatorioHoyOVencido(r, hoy))
            .slice(0, 12)
            .map((r: Record<string, unknown>) => {
              const pid = String(r['paciente_id'] || r['idPaciente'] || '');
              const pac = pacientesById[pid];
              const cid = pac ? getPacienteClienteId(pac) : String(r['cliente_id'] || '');
              const cli = clientesById[cid];
              const tel = normalizarTelefonoMx(cli?.telefono);
              const fecha = String(r['fecha_hora_recordatorio'] || r['fecha_recordatorio'] || '').slice(0, 10);
              return {
                id: String(r['id'] || ''),
                titulo: String(r['titulo'] || r['tipo'] || 'Recordatorio'),
                paciente: pac?.nombre || String(r['paciente'] || 'Mascota'),
                cliente: cli?.nombre || String(r['cliente'] || 'Dueño'),
                fecha,
                whatsappTel: tel,
                whatsappUrl: tel
                  ? buildWhatsappUrl(
                      tel,
                      buildMensajeWhatsappRecordatorio({
                        nombreDueno: cli?.nombre,
                        nombreMascota: pac?.nombre,
                        tipo: String(r['tipo'] || ''),
                        fecha,
                        titulo: String(r['titulo'] || ''),
                      })
                    )
                  : '',
                telUrl: tel ? buildTelUrl(tel) : '',
              };
            });
        },
        error: (err) => this.logger.error('Recordatorios hoy (hub):', err),
      });
  }

  private cargarPensionHoy(): void {
    this.pensionService
      .getEstancias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.pensionHoy = (rows || []).filter((e) => esEstanciaPensionHoy(e)).slice(0, 12);
        },
        error: (err) => this.logger.error('Pensión hoy (hub):', err),
      });
  }

  private cargarStockBajo(): void {
    this.inventarioService
      .getAlertasVigentes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alertas) => {
          this.stockBajoCount = (alertas || []).filter((a) => a.estado !== 'resuelta').length;
        },
        error: () => {
          this.stockBajoCount = 0;
        },
      });
  }

  async marcarRecordatorioHecho(id: string): Promise<void> {
    if (!id) return;
    this.loadingService.show(LOADING_MESSAGES.saving);
    try {
      await this.recordatoriosService.marcarCompletado(id);
      this.recordatoriosHoy = this.recordatoriosHoy.filter((r) => r.id !== id);
    } catch (error) {
      KatzenSwal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar recordatorio'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  atenderCita(cita: { paciente_id?: string; idPaciente?: string } | null): void {
    const id = pacienteIdDeCita(cita);
    if (!id) return;
    void this.router.navigate(['/admin/paciente'], { queryParams: { id } });
  }

  tipoPorCobrarLabel(tipo: string): string {
    const map: Record<string, string> = {
      visita: 'Ticket',
      banio: 'Baño',
      cita: 'Cita',
      pension: 'Pensión',
      vacuna: 'Vacuna',
      historial: 'Historial',
    };
    return map[tipo] || tipo;
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
      this.pacientesService.getPacientes(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([visitas, banios, citas, pensiones, vacunas, historiales, clientes, pacientes]) => {
          this.clientesMapHub = {};
          (clientes || []).forEach((c: any) => {
            if (c?.id) this.clientesMapHub[c.id] = c.nombre || c.nombre_completo || '';
          });
          this.pacientesClienteMapHub = {};
          (pacientes || []).forEach((p: any) => {
            if (!p?.id) return;
            const cid = p.cliente_id || p.idCliente || '';
            this.pacientesClienteMapHub[p.id] = { cliente_id: cid, nombre: p.nombre };
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
            clientesMap: this.clientesMapHub,
            pacientesClienteMap: this.pacientesClienteMapHub,
          });
          this.porCobrarTotal = totalPorCobrarHoy(this.porCobrarItems);
          this.pendientesPasados = pendientesDeDiasPasados(
            {
              banios: (banios || []) as unknown as Record<string, unknown>[],
              citas: (citas || []) as Record<string, unknown>[],
              tickets: (visitas || []) as unknown as Record<string, unknown>[],
            },
            hoy
          ).length;
        },
        error: (err) => this.logger.error('Por cobrar hoy (hub):', err),
      });
  }

  /** Etapa A — «Cierre del día»: resolver lo que quedó abierto de días anteriores. */
  async abrirCierreDia(): Promise<void> {
    const r = await abrirCierreDia(this.dialog);
    if (r?.abrirVisitaId) {
      const visita = await this.visitasService.getVisita(r.abrirVisitaId);
      if (visita) this.dialog.open(VisitaDialogComponent, { ...ADMIN_DIALOG_FORM, data: { visita } });
    }
    if (r?.cambios) this.cargarPorCobrarHoy();
  }

  /** Spec 111 — cuenta «Para avisar hoy» (se carga aparte, no pesa en la carga inicial). */
  async contarParaAvisar(): Promise<void> {
    const { contarParaAvisar } = await import('../para-avisar/para-avisar.loader');
    this.paraAvisar = await contarParaAvisar(this.injectorParaAvisar);
  }

  async abrirParaAvisar(): Promise<void> {
    const r = await abrirParaAvisar(this.dialog);
    if (r) this.paraAvisar = r.quedan;
  }

  async accionPorCobrar(item: PorCobrarItem): Promise<void> {
    if (item.accion === 'abrir_ticket' && item.visitaId) {
      const visita = await this.visitasService.getVisita(item.visitaId);
      if (visita) {
        this.dialog.open(VisitaDialogComponent, {
          ...ADMIN_DIALOG_FORM,
          data: { visita },
        });
      }
      return;
    }
    let monto = item.monto;
    if (!(monto > 0)) {
      monto = (await promptMontoVisita('Monto del servicio', `¿Cuánto se cobrará por ${item.descripcion}?`, 0)) ?? 0;
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
              : 'consulta';
      const opts: Parameters<VisitasService['agregarServicioAVisita']>[0] = {
        cliente_id: item.cliente_id,
        cliente: item.cliente,
        paciente_id: item.paciente_id,
        paciente: item.paciente,
        descripcion: item.descripcion,
        monto,
        categoria: cat as any,
        fecha: item.fecha,
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
        data: { visita: visita || undefined, cliente_id: item.cliente_id, cliente: item.cliente },
      });
      KatzenSwal.fire({ icon: 'success', title: 'Agregado al ticket', timer: 1400, showConfirmButton: false });
      this.cargarPorCobrarHoy();
    } catch (error) {
      KatzenSwal.fire('Error', this.errorMessages.getUserMessage(error, 'agregar a visita'), 'error');
    } finally {
      this.loadingService.hide();
    }
  }

  getSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // ——— calendario (072: debajo de cards de acceso) ———

  loadClientesYPacientes(): void {
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientes) => {
          (clientes || []).forEach((c: any) => {
            this.clientesMap[c.id] = c.nombre || c.nombreCliente || 'N/P';
          });
        },
      });
    this.pacientesService
      .getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pacientes) => {
          (pacientes || []).forEach((p: any) => {
            this.pacientesMap[p.id] = p.nombre || 'N/P';
          });
        },
      });
  }

  loadCitas(): void {
    this.citasService
      .getCitas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (citas) => {
          this.citas = (citas || []).filter((c: CitaCalendarioLike) => c.activo !== false);
          const hoy = hoyLocalIsoDate();
          this.citasMap = buildCitasMapByDate(this.citas);
          this.citasHoy = this.citasMap[hoy] || [];
          this.citasHoyCount = this.citasHoy.length;
          this.generateCalendar();
          this.syncSelectedDayFromMap();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  generateCalendar(): void {
    this.calendarDays = buildCalendarioMesDays(this.selectedDate, this.citasMap, new Date(), {
      baniosMap: this.baniosMap,
      estancias: this.estanciasCalendario,
    });
  }

  previousMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  goToToday(): void {
    const hoy = new Date();
    this.selectedDate = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.generateCalendar();
    const iso = isoKeyFromLocalDate(hoy);
    const cell = this.calendarDays.find((d) => d.isoKey === iso);
    if (cell) this.selectCalendarDay(cell);
  }

  getMonthYearString(): string {
    return `${this.monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}`;
  }

  selectCalendarDay(day: CalendarioDiaCell): void {
    if (!day?.isCurrentMonth || !day.isoKey || !day.date) return;
    this.selectedDayIso = day.isoKey;
    this.selectedDayDate = day.date;
    this.selectedDayCitas = day.citas || this.citasMap[day.isoKey] || [];
    this.selectedDayEventos = day.eventos?.length
      ? day.eventos
      : this.eventosDeIso(day.isoKey);
  }

  private syncSelectedDayFromMap(): void {
    const key = this.selectedDayIso || hoyLocalIsoDate();
    this.selectedDayIso = key;
    this.selectedDayCitas = this.citasMap[key] || [];
    this.selectedDayEventos = this.eventosDeIso(key);
    const [y, m, d] = key.split('-').map(Number);
    if (y && m && d) this.selectedDayDate = new Date(y, m - 1, d);
  }

  private eventosDeIso(isoKey: string): AgendaEventoDia[] {
    return eventosAgendaDelDia(
      isoKey,
      this.citasMap[isoKey] || [],
      this.baniosMap[isoKey] || [],
      this.estanciasCalendario
    );
  }

  private loadAgendaPeluqueriaYPension(): void {
    this.baniosService
      .getBanios()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (banios) => {
          this.baniosMap = buildBaniosMapByDate(banios as BanioCalendarioLike[]);
          this.generateCalendar();
          this.syncSelectedDayFromMap();
        },
        error: (err) => this.logger.error('Agenda peluquería:', err),
      });
    this.pensionService
      .getEstancias()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.estanciasCalendario = (rows || []) as PensionCalendarioLike[];
          this.generateCalendar();
          this.syncSelectedDayFromMap();
        },
        error: (err) => this.logger.error('Agenda pensión:', err),
      });
  }

  etiquetaAgenda(tipo: AgendaEventoTipo): string {
    return etiquetaAgendaTipo(tipo);
  }

  mascotaAgenda(ev: AgendaEventoDia): string {
    return this.pacientesMap[ev.paciente_id || ''] || ev.paciente || 'Mascota';
  }

  duenoAgenda(ev: AgendaEventoDia): string {
    return this.clientesMap[ev.cliente_id || ''] || ev.cliente || 'Dueño';
  }

  horaAgenda(ev: AgendaEventoDia): string {
    if (ev.tipo === 'cita' && ev.cita) {
      const hora = this.horaCita(ev.cita);
      return hora === '—' ? '' : hora;
    }
    return ev.hora || '';
  }

  abrirEventoAgenda(ev: AgendaEventoDia): void {
    if (ev.tipo === 'cita' && ev.cita) {
      this.verDetalleCita(ev.cita);
      return;
    }
    if (ev.tipo === 'peluqueria') {
      void this.router.navigate(['/admin/banios']);
      return;
    }
    void this.router.navigate(['/admin/pension']);
  }

  /** Lista del día en diálogo (accesibilidad / móvil). */
  showCitasForDay(day: CalendarioDiaCell): void {
    this.selectCalendarDay(day);
    if (!day?.date) return;
    this.dialog.open(CitasDiaDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: {
        fecha: day.date,
        citas: day.citas || [],
        // Citas + peluquería + pensión del día (antes solo llegaban las citas al modal).
        eventos: day.isoKey ? this.eventosDeIso(day.isoKey) : day.eventos || [],
        clientesMap: this.clientesMap,
        pacientesMap: this.pacientesMap,
      },
    });
  }

  verDetalleCita(cita: CitaCalendarioLike): void {
    this.dialog.open(CitaDialogComponent, {
      ...ADMIN_DIALOG_CONFIG,
      data: { cita, modoVer: true },
    });
  }

  horaCita(cita: CitaCalendarioLike): string {
    if (cita?.hora) return String(cita.hora);
    const fh = cita?.fecha_hora;
    if (fh) {
      const d = new Date(String(fh));
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      }
    }
    return '—';
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url = '',
    breadcrumbs: Array<{ label: string; url: string }> = []
  ): Array<{ label: string; url: string }> {
    const children = route.children;
    if (children.length === 0) return breadcrumbs;
    for (const child of children) {
      const routeURL = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeURL) {
        url += `/${routeURL}`;
        breadcrumbs.push({ label: child.snapshot.data['breadcrumb'] || routeURL, url });
      }
      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }
    return breadcrumbs;
  }
}
