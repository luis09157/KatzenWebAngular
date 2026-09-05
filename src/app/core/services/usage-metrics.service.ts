import { Injectable, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ADMIN_ROUTE_LABELS } from '../config/admin-route-labels.config';

/** Spec 066: clave localStorage. Cambiar el sufijo si cambia el formato. */
export const USAGE_METRICS_STORAGE_KEY = 'katzen.usage.v1';

export interface UsageEntry {
  count: number;
  /** ms epoch de la última apertura. */
  lastAt: number;
}

export type UsageMap = Record<string, UsageEntry>;

export interface UsageRow extends UsageEntry {
  modulo: string;
  label: string;
}

/** Segmentos bajo `/admin/` que no son módulos de trabajo. */
const SEGMENTOS_IGNORADOS = new Set(['login', 'recuperar', 'reset']);

/**
 * `/admin/inventario/productos?x=1` → `inventario`; `/admin` → `inicio`; fuera de `/admin` → `null`.
 * Solo el primer segmento: la métrica es por módulo del menú, no por pantalla.
 */
export function usageModuleKeyFromUrl(url: string | null | undefined): string | null {
  const path = String(url ?? '')
    .split(/[?#]/)[0]
    .replace(/\/+$/, '');
  if (path !== '/admin' && !path.startsWith('/admin/')) return null;
  const segments = path
    .replace(/^\/admin\/?/, '')
    .split('/')
    .filter(Boolean);
  const first = (segments[0] || 'inicio').toLowerCase();
  if (SEGMENTOS_IGNORADOS.has(first)) return null;
  return first;
}

/**
 * Métrica de uso por módulo admin, solo en este equipo (localStorage). Sin datos personales:
 * guarda módulo → { veces, último uso }. Base para decidir qué menús quitar (PLAN-UX extra 7).
 */
@Injectable({ providedIn: 'root' })
export class UsageMetricsService implements OnDestroy {
  private routerSub: Subscription | null = null;

  constructor(private router: Router) {}

  /** Idempotente: engancha `NavigationEnd` y registra la URL actual (la primera navegación ya pasó). */
  startTracking(): void {
    if (this.routerSub) return;
    this.registrar(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.registrar(e.urlAfterRedirects || e.url));
  }

  stopTracking(): void {
    this.routerSub?.unsubscribe();
    this.routerSub = null;
  }

  ngOnDestroy(): void {
    this.stopTracking();
  }

  /** Suma una apertura al módulo de la URL (ignora rutas fuera de `/admin`). Devuelve la clave o null. */
  registrar(url: string, ahora: number = Date.now()): string | null {
    const key = usageModuleKeyFromUrl(url);
    if (!key) return null;
    const data = this.leer();
    const prev = data[key];
    data[key] = { count: (prev?.count || 0) + 1, lastAt: ahora };
    this.escribir(data);
    return key;
  }

  leer(): UsageMap {
    try {
      const raw = localStorage.getItem(USAGE_METRICS_STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
      const out: UsageMap = {};
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        const e = v as Partial<UsageEntry> | null;
        const count = Number(e?.count);
        if (!Number.isFinite(count) || count <= 0) continue;
        out[k] = { count, lastAt: Number(e?.lastAt) || 0 };
      }
      return out;
    } catch {
      return {};
    }
  }

  /** Filas para el panel: menos usados primero; empate → más antiguo primero. */
  listar(): UsageRow[] {
    return Object.entries(this.leer())
      .map(([modulo, e]) => ({ modulo, label: ADMIN_ROUTE_LABELS[modulo] || modulo, ...e }))
      .sort((a, b) => a.count - b.count || a.lastAt - b.lastAt || a.label.localeCompare(b.label));
  }

  reiniciar(): void {
    try {
      localStorage.removeItem(USAGE_METRICS_STORAGE_KEY);
    } catch {
      /* localStorage bloqueado: nada que borrar */
    }
  }

  private escribir(data: UsageMap): void {
    try {
      localStorage.setItem(USAGE_METRICS_STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* cuota / modo privado: la métrica es opcional, no bloquea la navegación */
    }
  }
}
