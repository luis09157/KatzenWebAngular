import { Component, HostListener, Injector, OnDestroy, OnInit, inject } from '@angular/core';
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
import { InventarioService } from '../inventario/inventario.service';
import { MatDialog } from '@angular/material/dialog';
import { ADMIN_DIALOG_DETAIL } from '../core/config/admin-ui.config';
import { AyudaDialogComponent } from '../ayuda/ayuda-dialog.component';
import Swal from 'sweetalert2';

import { AvisosDialogComponent } from '../shared/admin/avisos-dialog.component';
import { ItemCampanita, itemsCampanita, textoGlobito } from '../para-avisar/campanita.util';
@Component({
  selector: 'app-admin-main-layout',
  templateUrl: './admin-main-layout.component.html',
  styleUrls: ['./admin-main-layout.component.css'],
})
export class AdminMainLayoutComponent implements OnInit, OnDestroy {
  /** Tras este tiempo sin usar el menú, se oculta para ganar espacio (061 US-6). */
  private static readonly SIDENAV_AUTO_HIDE_MS = 15_000;

  private readonly destroy$ = new Subject<void>();
  private resizeHandler = () => this.checkMobile();
  private autoHideTimer: ReturnType<typeof setTimeout> | null = null;
  /** Evita que resize reabra el menú si el usuario ya lo cerró / auto-hide. */
  private sidenavInitialized = false;
  private pointerOverSidenav = false;

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
  /** URL actual para marcar «Pacientes» activo en directorio y expediente. */
  currentUrl = '';
  registeringStaffPush = false;
  /** 2026-10-26 — permiso de avisos en este celular (para el menú y el aviso de arriba). */
  permisoAvisos: NotificationPermission | 'unsupported' = 'default';
  /** Se oculta el aviso «Activa los avisos» por esta sesión si la persona lo cierra. */
  avisoAvisosCerrado = false;
  /** Spec 064: ng serve apuntando al emulador RTDB. */
  readonly rtdbEmulator = !environment.production && environment.useRtdbEmulator;
  /** Spec 069 — alertas de stock activas para badge del menú. */
  alertasStockCount = 0;
  /** Spec 111 — clientes para avisar hoy. Spec 117: se muestra en la campanita de arriba. */
  paraAvisarCount = 0;
  /** Spec 117 — renglones de la campanita. */
  itemsCampanita: ItemCampanita[] = [];
  cargandoCampanita = false;
  private readonly maxItemsCampanita = 8;
  private paraAvisarTimer: ReturnType<typeof setInterval> | null = null;
  private readonly injectorParaAvisar = inject(Injector);

  constructor(
    private authService: AuthService,
    private authProfileService: AuthProfileService,
    private sucursalContext: SucursalContextService,
    private router: Router,
    private logger: LoggerService,
    private portalFcm: PortalFcmService,
    private errorMessages: ErrorMessagesService,
    private usageMetrics: UsageMetricsService,
    private inventarioService: InventarioService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.checkMobile();
    // Spec 066: conteo local de aperturas por módulo (localStorage, sin datos personales).
    this.usageMetrics.startTracking();
    this.sucursales = this.sucursalContext.sucursales;
    this.sucursalSeleccionada = this.sucursalContext.getSelectedId();
    window.addEventListener('resize', this.resizeHandler);
    this.currentUrl = this.router.url;
    this.toolbarLabel = resolveAdminRouteLabel(this.router.url);
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => {
        const nav = event as NavigationEnd;
        this.currentUrl = nav.urlAfterRedirects || nav.url;
        this.toolbarLabel = resolveAdminRouteLabel(this.currentUrl);
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
            if (this.canShow('inventario')) {
              this.suscribirAlertasStock();
            }
            if (this.canShow('recordatorios')) {
              this.programarConteoParaAvisar();
            }
            void this.iniciarAvisos();
            return null;
          });
        })
      )
      .subscribe();
  }

  /** Spec 111 — cuenta «Para avisar hoy» unos segundos después de entrar y cada 30 min. */
  private programarConteoParaAvisar(): void {
    if (this.paraAvisarTimer) return;
    setTimeout(() => void this.refrescarCampanita(), 5000);
    this.paraAvisarTimer = setInterval(() => void this.refrescarCampanita(), 30 * 60 * 1000);
  }

  /** Spec 117 — la campanita se ve si la persona puede ver Recordatorios o Inventario. */
  get muestraCampanita(): boolean {
    return this.canShow('recordatorios') || this.canShow('inventario');
  }

  /** Solo avisos del día: las alertas de inventario (suelen ser muchas) van como renglón, sin sumar. */
  get totalCampanita(): number {
    return this.itemsCampanita.length;
  }

  get muestraInventarioEnCampanita(): boolean {
    return this.alertasStockCount > 0 && this.canShow('inventario');
  }

  get globoCampanita(): string {
    return textoGlobito(this.totalCampanita);
  }

  get itemsCampanitaVisibles(): ItemCampanita[] {
    return this.itemsCampanita.slice(0, this.maxItemsCampanita);
  }

  private ultimaCampanitaMs = 0;

  /** 2026-10-30 — al regresar a la pestaña, si pasaron 5 min, actualiza la campanita. */
  @HostListener('document:visibilitychange')
  alRegresarALaPestana(): void {
    if (document.visibilityState !== 'visible' || !this.paraAvisarTimer) return;
    if (Date.now() - this.ultimaCampanitaMs >= 5 * 60_000) void this.refrescarCampanita();
  }

  /** Spec 117 — recarga los avisos (al entrar, cada 30 min y al abrir la campanita). Solo lee. */
  async refrescarCampanita(): Promise<void> {
    if (!this.canShow('recordatorios') || this.cargandoCampanita) return;
    this.cargandoCampanita = true;
    this.ultimaCampanitaMs = Date.now();
    try {
      const { cargarParaAvisar } = await import('../para-avisar/para-avisar.loader');
      const avisos = await cargarParaAvisar(this.injectorParaAvisar);
      this.itemsCampanita = itemsCampanita(avisos);
      this.paraAvisarCount = avisos.length;
    } catch (error) {
      this.logger.error('Campanita: no se pudieron cargar los avisos', error);
    } finally {
      this.cargandoCampanita = false;
    }
  }

  irAAviso(ruta: string): void {
    void this.router.navigateByUrl(ruta);
  }

  /** Spec 117 — abre «Para avisar hoy» (botones de WhatsApp; nada se manda solo). */
  async abrirParaAvisarDesdeCampanita(): Promise<void> {
    const { abrirParaAvisar } = await import('../para-avisar/para-avisar.launcher');
    await abrirParaAvisar(this.dialog);
    void this.refrescarCampanita();
  }

  ngOnDestroy() {
    if (this.paraAvisarTimer) clearInterval(this.paraAvisarTimer);
    window.removeEventListener('resize', this.resizeHandler);
    this.clearAutoHideTimer();
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

  /**
   * Desktop: menú lateral abierto al inicio; se oculta solo tras inactividad o navegación.
   * Móvil: cerrado; se abre con hamburguesa (mode over).
   * Resize solo aplica al cruzar el breakpoint 900px (no pelea con toggle/auto-hide).
   */
  checkMobile() {
    const nextMobile = window.innerWidth < 900;
    if (!this.sidenavInitialized) {
      this.isMobile = nextMobile;
      this.sidenavOpened = !nextMobile;
      this.sidenavInitialized = true;
      if (this.sidenavOpened) {
        this.scheduleAutoHide();
      }
      return;
    }
    if (this.isMobile === nextMobile) {
      return;
    }
    this.isMobile = nextMobile;
    this.sidenavOpened = !nextMobile;
    if (this.sidenavOpened) {
      this.scheduleAutoHide();
    } else {
      this.clearAutoHideTimer();
    }
  }

  toggleSidenav(): void {
    this.sidenavOpened = !this.sidenavOpened;
    if (this.sidenavOpened) {
      this.scheduleAutoHide();
    } else {
      this.clearAutoHideTimer();
    }
  }

  /** Cierra en móvil y desktop (ganar espacio tras navegar / auto-hide). */
  closeSidenav(): void {
    this.sidenavOpened = false;
    this.clearAutoHideTimer();
  }

  onSidenavOpenedChange(opened: boolean): void {
    this.sidenavOpened = opened;
    if (opened) {
      this.scheduleAutoHide();
    } else {
      this.clearAutoHideTimer();
    }
  }

  onSidenavPointerEnter(): void {
    this.pointerOverSidenav = true;
    this.clearAutoHideTimer();
  }

  onSidenavPointerLeave(): void {
    this.pointerOverSidenav = false;
    if (this.sidenavOpened) {
      this.scheduleAutoHide();
    }
  }

  private scheduleAutoHide(): void {
    this.clearAutoHideTimer();
    if (!this.sidenavOpened || this.pointerOverSidenav) {
      return;
    }
    this.autoHideTimer = setTimeout(() => {
      this.autoHideTimer = null;
      if (this.pointerOverSidenav) {
        return;
      }
      this.sidenavOpened = false;
    }, AdminMainLayoutComponent.SIDENAV_AUTO_HIDE_MS);
  }

  private clearAutoHideTimer(): void {
    if (this.autoHideTimer != null) {
      clearTimeout(this.autoHideTimer);
      this.autoHideTimer = null;
    }
  }

  async logout(): Promise<void> {
    this.logger.log('Iniciando logout...');
    try {
      await this.authService.logout();
    } catch (error) {
      this.logger.error('Error en logout:', error);
      await this.router.navigateByUrl('/admin/login');
    }
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

  /**
   * Menú único «Pacientes» (2026-10-26): abre el directorio si el rol lo tiene;
   * si no (peluquero), abre la búsqueda de expediente.
   */
  get rutaPacientes(): string | null {
    if (this.canShow('pacientes-admin')) return '/admin/pacientes-admin';
    if (this.canShow('paciente')) return '/admin/paciente';
    return null;
  }

  /** 2026-10-30 — barra inferior en celular (Hoy · Pacientes · Peluquería · Cobrar · Más). */
  get barraInferior(): { label: string; icono: string; ruta: string; activo: boolean }[] {
    const path = (this.currentUrl || '').split(/[?#]/)[0];
    const items: { label: string; icono: string; ruta: string; activo: boolean }[] = [];
    if (this.canShow('inicio')) items.push({ label: 'Hoy', icono: 'today', ruta: '/admin/inicio', activo: path === '/admin/inicio' || path === '/admin' });
    const pacientes = this.rutaPacientes;
    if (pacientes) items.push({ label: 'Pacientes', icono: 'pets', ruta: pacientes, activo: this.rutaPacientesActiva });
    if (this.canShow('banios')) items.push({ label: 'Peluquería', icono: 'spa', ruta: '/admin/banios', activo: path.startsWith('/admin/banios') });
    if (this.canShow('visitas')) items.push({ label: 'Cobrar', icono: 'point_of_sale', ruta: '/admin/visitas', activo: path.startsWith('/admin/visitas') });
    return items;
  }

  get muestraBarraInferior(): boolean {
    return this.isMobile && this.barraInferior.length >= 2;
  }

  /** «Pacientes» queda marcado en el directorio y dentro del expediente. */
  get rutaPacientesActiva(): boolean {
    const path = (this.currentUrl || '').split(/[?#]/)[0];
    return path.startsWith('/admin/pacientes-admin') || path === '/admin/paciente' || path.startsWith('/admin/paciente/');
  }

  private suscribirAlertasStock(): void {
    this.inventarioService
      .getAlertasVigentes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (alertas) => {
          this.alertasStockCount = (alertas || []).filter((a) => a.estado !== 'resuelta').length;
        },
        error: () => {
          this.alertasStockCount = 0;
        },
      });
  }

  get hasAgendaNav(): boolean {
    return this.canShow('citas') || this.canShow('banios') || this.canShow('pension');
  }

  get hasMasNav(): boolean {
    return (
      this.canShow('inventario') ||
      this.canShow('finanzas') ||
      this.canShow('servicios-clinica') ||
      this.canShow('usuarios') ||
      this.canShow('contactos-web') ||
      this.canShow('configuracion')
    );
  }

  /** Personal, contactos, finanzas/corte y config (separados del catálogo clínico). */
  get hasAdminNav(): boolean {
    return (
      this.canShow('usuarios') ||
      this.canShow('contactos-web') ||
      this.canShow('finanzas') ||
      this.canShow('configuracion')
    );
  }

  abrirAyuda(): void {
    this.dialog.open(AyudaDialogComponent, { ...ADMIN_DIALOG_DETAIL });
    this.closeSidenav();
  }

  irAMiPortal(): void {
    this.router.navigate(['/portal/mascotas']);
    this.closeSidenav();
  }

  /**
   * 2026-10-26 — al entrar: si ya hay permiso, registra/renueva el celular sin preguntar y
   * escucha avisos con el sistema abierto. Si no hay permiso, el menú y el aviso de arriba lo piden.
   */
  private async iniciarAvisos(): Promise<void> {
    this.permisoAvisos = this.portalFcm.currentPermission();
    try {
      await this.portalFcm.refrescarSiYaAutorizado('admin_web');
    } catch {
      /* best-effort: nunca bloquea el panel */
    }
    try {
      this.avisoAvisosCerrado = sessionStorage.getItem('kv-aviso-avisos-cerrado') === '1';
    } catch {
      this.avisoAvisosCerrado = false;
    }
  }

  get mostrarAvisoActivarAvisos(): boolean {
    return this.permisoAvisos === 'default' && !this.avisoAvisosCerrado;
  }

  get etiquetaMenuAvisos(): string {
    if (this.permisoAvisos === 'granted') return 'Avisos: activados';
    if (this.permisoAvisos === 'denied') return 'Avisos: bloqueados';
    return 'Avisos: activar';
  }

  cerrarAvisoActivarAvisos(): void {
    this.avisoAvisosCerrado = true;
    try {
      sessionStorage.setItem('kv-aviso-avisos-cerrado', '1');
    } catch {
      /* sin storage: solo se oculta ahora */
    }
  }

  /** Panel «Avisos»: este celular + (admin/super admin) quién del personal los recibe. */
  abrirAvisos(): void {
    this.closeSidenav();
    const ref = this.dialog.open(AvisosDialogComponent, {
      ...ADMIN_DIALOG_DETAIL,
      data: { verEquipo: this.isAdmin },
    });
    ref.afterClosed().subscribe(() => {
      this.permisoAvisos = this.portalFcm.currentPermission();
    });
  }

  /** Atajo del aviso de arriba: pide el permiso con un toque (el navegador exige un toque). */
  async activarAvisosClinica(): Promise<void> {
    if (this.registeringStaffPush) return;
    this.registeringStaffPush = true;
    try {
      const result = await this.portalFcm.registerStaffToken();
      this.permisoAvisos = this.portalFcm.currentPermission();
      if (result.status === 'registered') {
        this.portalFcm.escucharEnPrimerPlano();
        await Swal.fire({
          icon: 'success',
          title: 'Avisos activados',
          text: 'Te llegarán los avisos de la clínica en este celular. Se renuevan solos cada vez que entras.',
          timer: 2600,
          showConfirmButton: false,
        });
      } else {
        this.abrirAvisos();
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
