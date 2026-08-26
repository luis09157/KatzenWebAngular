import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import { CitasService } from '../citas/citas.service';
import { ClientesService } from '../clientes/clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { MatDialog } from '@angular/material/dialog';
import { CitasDiaDialogComponent } from './citas-dia-dialog.component';
import { ADMIN_DIALOG_DETAIL } from '../core/config/admin-ui.config';
import { AdminModuleAccent } from '../shared/admin/admin-module-card.component';
import { OwnerDashboardService } from './owner-dashboard.service';
import { OwnerDashboardSnapshot } from './owner-dashboard.models';
import {
  PeriodoPreset,
  formatMoneyMx,
  formatLabelEs
} from '../core/utils/periodo-filtro.util';
import { LoggerService } from '../core/logger.service';

interface DashboardModule {
  title: string;
  description: string;
  route: string;
  accent: AdminModuleAccent;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('* <=> *', [
        style({ opacity: 0 }),
        animate('250ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private ownerSub?: Subscription;
  breadcrumbs: Array<{ label: string; url: string }> = [];
  currentDate = new Date();
  selectedDate = new Date();
  calendarDays: any[] = [];
  citas: any[] = [];
  citasMap: { [key: string]: any[] } = {};
  selectedDayCitas: any[] = [];
  selectedDayDate: Date | null = null;
  clientesMap: { [id: string]: string } = {};
  pacientesMap: { [id: string]: string } = {};
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  loading = false;
  ownerLoading = false;
  showAllModules = false;
  readonly primaryModuleCount = 6;

  /** Spec 025 — filtros dashboard dueño */
  periodoPreset: PeriodoPreset = 'este_mes';
  desdeCustom = '';
  hastaCustom = '';
  snap: OwnerDashboardSnapshot | null = null;
  readonly presets: Array<{ id: PeriodoPreset; label: string }> = [
    { id: 'este_mes', label: 'Este mes' },
    { id: 'mes_anterior', label: 'Mes anterior' },
    { id: '30d', label: '30 días' },
    { id: '60d', label: '60 días' }
  ];

  readonly allModules: DashboardModule[] = [
    {
      title: 'Pacientes',
      description: 'Registra mascotas, historial clínico y datos del expediente en un solo lugar.',
      route: 'pacientes-admin',
      accent: 'teal'
    },
    {
      title: 'Clientes',
      description: 'Administra dueños, contacto, dirección y expedientes vinculados a sus mascotas.',
      route: 'clientes',
      accent: 'blue'
    },
    {
      title: 'Citas',
      description: 'Programa consultas, controla la agenda diaria y da seguimiento a cada cita.',
      route: 'citas',
      accent: 'purple'
    },
    {
      title: 'Historiales clínicos',
      description: 'Consulta diagnósticos, tratamientos y evolución médica de cada paciente.',
      route: 'historiales',
      accent: 'pink'
    },
    {
      title: 'Vacunas',
      description: 'Lleva el control de esquemas, fechas de aplicación y recordatorios de refuerzo.',
      route: 'vacunas',
      accent: 'green'
    },
    {
      title: 'Inventario',
      description: 'Gestiona productos, movimientos, órdenes de compra y alertas de stock bajo.',
      route: 'inventario',
      accent: 'orange'
    },
    {
      title: 'Finanzas / caja',
      description: 'Cobros, costos de servicio, rentabilidad y defaults de baño por tamaño.',
      route: 'finanzas',
      accent: 'green'
    },
    {
      title: 'Pensión / alojamiento',
      description: 'Hospedaje de mascotas: estancias, precios por día y cobro en caja.',
      route: 'pension',
      accent: 'teal'
    },
    {
      title: 'Baños y estética',
      description: 'Agenda servicios de baño, peluquería y cuidado estético por paciente.',
      route: 'banios',
      accent: 'teal'
    },
    {
      title: 'Recordatorios',
      description: 'Crea avisos para vacunas, citas de seguimiento y tareas pendientes del equipo.',
      route: 'recordatorios',
      accent: 'blue'
    },
    {
      title: 'Usuarios',
      description: 'Administra accesos del personal, perfiles y permisos del sistema.',
      route: 'usuarios',
      accent: 'purple'
    }
  ];

  get visibleModules(): DashboardModule[] {
    return this.showAllModules
      ? this.allModules
      : this.allModules.slice(0, this.primaryModuleCount);
  }

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
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loading = true;
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
    this.generateCalendar();
    this.cargarOwnerDashboard();
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

  cargarOwnerDashboard(): void {
    this.ownerLoading = true;
    this.ownerSub?.unsubscribe();
    this.ownerSub = this.ownerDashboard
      .snapshot$(
        this.periodoPreset,
        this.desdeCustom || undefined,
        this.hastaCustom || undefined
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (snap) => {
          this.snap = snap;
          this.ownerLoading = false;
        },
        error: (err) => {
          this.logger.error('Error dashboard dueño:', err);
          this.ownerLoading = false;
        }
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

  toggleModules(): void {
    this.showAllModules = !this.showAllModules;
  }

  getSaludo(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // ——— calendario (existente) ———

  loadClientesYPacientes(): void {
    this.clientesService
      .getClientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (clientes) => {
          (clientes || []).forEach((c: any) => {
            this.clientesMap[c.id] = c.nombre || c.nombreCliente || 'N/P';
          });
        }
      });
    this.pacientesService
      .getPacientes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pacientes) => {
          (pacientes || []).forEach((p: any) => {
            this.pacientesMap[p.id] = p.nombre || 'N/P';
          });
        }
      });
  }

  loadCitas(): void {
    this.citasService
      .getCitas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (citas) => {
          this.citas = (citas || []).filter((c: any) => c.activo !== false);
          this.citasMap = {};
          this.citas.forEach((cita) => {
            const key = this.getCitaDateKey(cita);
            if (!key) return;
            if (!this.citasMap[key]) this.citasMap[key] = [];
            this.citasMap[key].push(cita);
          });
          this.generateCalendar();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  private getCitaDateKey(cita: any): string | null {
    const raw = cita.fecha || cita.fecha_hora;
    if (!raw) return null;
    const s = String(raw);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  generateCalendar(): void {
    const year = this.selectedDate.getFullYear();
    const month = this.selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: any[] = [];
    const prevMonthDays = new Date(year, month, 0).getDate();

    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isToday: false,
        hasCitas: false,
        citas: []
      });
    }
    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayCitas = this.citasMap[key] || [];
      days.push({
        day: d,
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
        hasCitas: dayCitas.length > 0,
        citas: dayCitas
      });
    }
    while (days.length % 7 !== 0) {
      days.push({
        day: days.length % 7,
        isCurrentMonth: false,
        isToday: false,
        hasCitas: false,
        citas: []
      });
    }
    this.calendarDays = days;
  }

  previousMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.selectedDate = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  getMonthYearString(): string {
    return `${this.monthNames[this.selectedDate.getMonth()]} ${this.selectedDate.getFullYear()}`;
  }

  showCitasForDay(day: any): void {
    if (!day?.hasCitas) return;
    this.dialog.open(CitasDiaDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: {
        fecha: day.date,
        citas: day.citas,
        clientesMap: this.clientesMap,
        pacientesMap: this.pacientesMap
      }
    });
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
