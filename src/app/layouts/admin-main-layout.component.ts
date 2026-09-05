import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { filter, takeUntil, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { SucursalContextService } from '../core/services/sucursal-context.service';
import { navModulesForStaffRole, StaffModule, staffRoleShowsCompactNav } from '../core/config/staff-role.config';
import { NavigationEnd, Router } from '@angular/router';
import { LoggerService } from '../core/logger.service';
import { resolveAdminRouteLabel } from '../core/config/admin-route-labels.config';
import { PortalFcmService } from '../core/services/portal-fcm.service';
import { ErrorMessagesService } from '../core/error-messages.service';
import { UsageMetricsService } from '../core/services/usage-metrics.service';
import { environment } from '../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-admin-main-layout',
  templateUrl: './admin-main-layout.component.html',
  styleUrls: ['./admin-main-layout.component.css'],
})
export class AdminMainLayoutComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private resizeHandler = () => this.checkMobile();
  sidenavOpened = false;
  totalPacientes = 0;
  totalClientes = 0;
  citasHoy = 0;
  usuario: { nombre: string; rol: string; email: string } = { nombre: 'Administrador', rol: 'admin', email: '' };
  isMobile = false;
  isAdmin = false;
  /** Staff con clienteId / dualAccess: atajo al portal. */
  canGoPortal = false;
  accessibleModules = new Set<StaffModule>();
  navModules = new Set<StaffModule>();
  navCompact = false;
  staffRole = '';
  sucursales: { id: string; nombre: string }[] = [];
  sucursalSeleccionada = 'principal';
  toolbarLabel = 'Admin';
  registeringStaffPush = false;
  /** Spec 064: ng serve apuntando al emulador RTDB. */
  readonly rtdbEmulator = !environment.production && environment.useRtdbEmulator;

  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private sucursalContext: SucursalContextService,
    private router: Router,
    private logger: LoggerService,
    private portalFcm: PortalFcmService,
    private errorMessages: ErrorMessagesService,
    private usageMetrics: UsageMetricsService
  ) {}

  ngOnInit() {
    this.checkMobile();
    // Spec 066: conteo local de aperturas por módulo (localStorage, sin datos personales).
    this.usageMetrics.startTracking();
    this.sucursales = this.sucursalContext.sucursales;
    this.sucursalSeleccionada = this.sucursalContext.getSelectedId();
    window.addEventListener('resize', this.resizeHandler);
    this.toolbarLabel = resolveAdminRouteLabel(this.router.url);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.toolbarLabel = resolveAdminRouteLabel(nav.urlAfterRedirects || nav.url);
      });
    this.authService.user$
      .pipe(
        takeUntil(this.destroy$),
        switchMap((user) => {
          if (!user?.uid) return of(null);
          this.usuario = { nombre: user.displayName || 'Administrador', rol: 'admin', email: user.email || '' };
          return this.authProfileService.resolveAccess().then(async (access) => {
            const staffRole = await this.authProfileService.getEffectiveStaffRole();
            this.staffRole = staffRole;
            this.navCompact = staffRoleShowsCompactNav(staffRole);
            const nav = navModulesForStaffRole(staffRole);
            this.navModules = new Set(nav);
            const modules = await this.authProfileService.getAccessibleModules();
            this.accessibleModules = new Set(modules);
            this.isAdmin = modules.includes('usuarios');
            this.canGoPortal = !!(access.clientAccess && access.clienteId);
            return null;
          });
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.resizeHandler);
    this.destroy$.next();
    this.destroy$.complete();
  }

  getSaludo(): string {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) {
      return '¡Buenos días!';
    } else if (hora >= 12 && hora < 19) {
      return '¡Buenas tardes!';
    } else {
      return '¡Buenas noches!';
    }
  }

  getNombreUsuario(): string {
    if (this.usuario?.email) {
      return this.usuario.email;
    }
    return 'Administrador';
  }

  onSucursalChange(sucursalId: string): void {
    this.sucursalContext.setSelectedId(sucursalId);
    this.sucursalSeleccionada = sucursalId;
  }

  checkMobile() {
    this.isMobile = window.innerWidth < 900;
    this.sidenavOpened = !this.isMobile;
  }

  toggleSidenav() {
    this.sidenavOpened = !this.sidenavOpened;
  }

  closeSidenav() {
    // En desktop el sidenav es permanente (mode=side); solo cerrar en móvil (over).
    if (this.isMobile) {
      this.sidenavOpened = false;
    }
  }

  logout() {
    this.logger.log('Iniciando logout...');
    this.authService
      .logout()
      .then(() => {
        this.logger.log('Logout exitoso, redirigiendo...');
      })
      .catch((error) => {
        this.logger.error('Error en logout:', error);
        this.router.navigate(['/admin/login']);
      });
  }

  navegar(ruta: string) {
    this.logger.log('🚀 Navegando a:', ruta);
    this.router.navigate([ruta]);
    this.closeSidenav();
  }

  irAlInicio() {
    this.router.navigate(['/admin/inicio']);
  }

  canShow(module: StaffModule): boolean {
    if (this.navModules.size === 0 && this.accessibleModules.size === 0) {
      return false;
    }
    if (this.navCompact) {
      return this.navModules.has(module);
    }
    return this.accessibleModules.has(module);
  }

  get muestraDashboardMetricas(): boolean {
    return this.canShow('inicio') && !this.navCompact;
  }

  get hasClinicaNav(): boolean {
    return (
      this.canShow('paciente') ||
      this.canShow('citas') ||
      this.canShow('historiales') ||
      this.canShow('vacunas') ||
      this.canShow('banios') ||
      this.canShow('pension') ||
      this.canShow('recordatorios') ||
      this.canShow('consentimientos')
    );
  }

  get hasPosNav(): boolean {
    return this.canShow('visitas');
  }

  get hasAdminNav(): boolean {
    return (
      this.canShow('clientes') ||
      this.canShow('pacientes-admin') ||
      this.canShow('inventario') ||
      this.canShow('finanzas') ||
      this.canShow('servicios-clinica') ||
      this.canShow('usuarios') ||
      this.canShow('contactos-web') ||
      this.canShow('inicio')
    );
  }

  irAMiPortal(): void {
    this.router.navigate(['/portal/mascotas']);
    this.closeSidenav();
  }

  async activarAvisosClinica(): Promise<void> {
    if (this.registeringStaffPush) return;
    this.registeringStaffPush = true;
    try {
      const result = await this.portalFcm.registerStaffToken();
      if (result.status === 'registered') {
        await Swal.fire({
          icon: 'success',
          title: 'Avisos de clínica activados',
          text: 'Recibirás un resumen (Hoy N vacunas) cerca de la fecha, no al registrar un refuerzo lejano.',
        });
      } else if (result.status === 'denied') {
        await Swal.fire({
          icon: 'warning',
          title: 'Permiso denegado',
          text: 'Habilita notificaciones en el navegador para avisos de vacunas.',
        });
      } else {
        await Swal.fire({
          icon: 'info',
          title: 'No se activaron los avisos',
          text:
            result.detail ||
            this.errorMessages.getUserMessage(new Error(result.detail || 'push'), 'activar avisos clínica'),
        });
      }
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'No se pudieron activar los avisos',
        text: this.errorMessages.getUserMessage(error, 'activar avisos clínica'),
      });
    } finally {
      this.registeringStaffPush = false;
    }
  }
}
