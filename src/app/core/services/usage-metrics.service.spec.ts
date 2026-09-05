import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { USAGE_METRICS_STORAGE_KEY, UsageMetricsService, usageModuleKeyFromUrl } from './usage-metrics.service';

describe('UsageMetricsService (spec 066)', () => {
  let events$: Subject<unknown>;
  let router: { url: string; events: Subject<unknown> };
  let service: UsageMetricsService;

  beforeEach(() => {
    localStorage.clear();
    events$ = new Subject<unknown>();
    router = { url: '/admin/login', events: events$ };
    service = new UsageMetricsService(router as unknown as Router);
  });

  afterEach(() => {
    service.stopTracking();
    localStorage.clear();
  });

  it('usageModuleKeyFromUrl agrupa por primer segmento bajo /admin', () => {
    expect(usageModuleKeyFromUrl('/admin/inventario/productos?page=2')).toBe('inventario');
    expect(usageModuleKeyFromUrl('/admin/inventario/movimientos')).toBe('inventario');
    expect(usageModuleKeyFromUrl('/admin')).toBe('inicio');
    expect(usageModuleKeyFromUrl('/admin/')).toBe('inicio');
    expect(usageModuleKeyFromUrl('/portal/mascotas')).toBeNull();
    expect(usageModuleKeyFromUrl('/')).toBeNull();
    expect(usageModuleKeyFromUrl('/admin/login')).toBeNull();
  });

  it('cuenta aperturas y guarda lastAt en localStorage[katzen.usage.v1]', () => {
    service.registrar('/admin/citas', 1000);
    service.registrar('/admin/citas', 2000);
    service.registrar('/admin/recordatorios', 1500);

    const raw = JSON.parse(localStorage.getItem(USAGE_METRICS_STORAGE_KEY) || '{}');
    expect(raw).toEqual({
      citas: { count: 2, lastAt: 2000 },
      recordatorios: { count: 1, lastAt: 1500 },
    });
  });

  it('agrupa subrutas de un módulo en una sola clave', () => {
    service.registrar('/admin/inventario/productos');
    service.registrar('/admin/inventario/ordenes');
    service.registrar('/admin/inventario');
    expect(service.leer()['inventario'].count).toBe(3);
    expect(service.leer()['productos']).toBeUndefined();
  });

  it('ignora rutas no admin y login', () => {
    expect(service.registrar('/portal/login')).toBeNull();
    expect(service.registrar('/admin/login')).toBeNull();
    expect(service.registrar('/')).toBeNull();
    expect(localStorage.getItem(USAGE_METRICS_STORAGE_KEY)).toBeNull();
  });

  it('startTracking escucha NavigationEnd (no NavigationStart) y registra la URL actual', () => {
    router.url = '/admin/usuarios';
    service.startTracking();
    events$.next(new NavigationStart(1, '/admin/finanzas'));
    events$.next(new NavigationEnd(1, '/admin/finanzas', '/admin/finanzas'));
    events$.next(new NavigationEnd(2, '/admin/paciente', '/admin/paciente?id=1'));
    service.startTracking(); // idempotente: no duplica ni re-registra

    const data = service.leer();
    expect(data['usuarios'].count).toBe(1);
    expect(data['finanzas'].count).toBe(1);
    expect(data['paciente'].count).toBe(1);
  });

  it('listar ordena menos usados primero con etiqueta legible; reiniciar borra todo', () => {
    service.registrar('/admin/citas');
    service.registrar('/admin/citas');
    service.registrar('/admin/citas');
    service.registrar('/admin/finanzas');
    service.registrar('/admin/inventario/productos');
    service.registrar('/admin/inventario');

    const filas = service.listar();
    expect(filas.map((f) => f.modulo)).toEqual(['finanzas', 'inventario', 'citas']);
    expect(filas[0].label).toBe('Caja / finanzas');

    service.reiniciar();
    expect(service.listar()).toEqual([]);
    expect(localStorage.getItem(USAGE_METRICS_STORAGE_KEY)).toBeNull();
  });

  it('tolera JSON corrupto en localStorage', () => {
    localStorage.setItem(USAGE_METRICS_STORAGE_KEY, '{no-json');
    expect(service.leer()).toEqual({});
    service.registrar('/admin/citas');
    expect(service.leer()['citas'].count).toBe(1);
  });
});
