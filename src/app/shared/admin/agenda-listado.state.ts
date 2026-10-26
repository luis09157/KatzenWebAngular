import { MatTableDataSource } from '@angular/material/table';
import {
  ClasificadorAgenda,
  FILTROS_AGENDA,
  FiltroAgenda,
  SeccionAgenda,
  contarFiltrosAgenda,
  filtrarAgenda,
  seccionesPendientesAgenda,
} from '../../core/utils/agenda-filtros.util';

export type SeccionAgendaTabla<T> = SeccionAgenda<T> & { ds: MatTableDataSource<T> };

/**
 * Estado del listado con filtros de agenda (Citas, Peluquería, Pensión) — 2026-10-26.
 *
 * - «Pendientes» sin búsqueda → `secciones` (Atrasados → Hoy → Mañana → Próximos días).
 * - Otro filtro o búsqueda → `plana` (una tabla con paginador).
 * - Buscar estando en «Pendientes» busca en todo el historial (como antes).
 */
export class AgendaListadoState<T> {
  filtro: FiltroAgenda = 'pendientes';
  cuentas: Partial<Record<FiltroAgenda, number>> = {};
  atrasados = 0;
  hoy = 0;
  secciones: SeccionAgendaTabla<T>[] = [];
  readonly plana = new MatTableDataSource<T>([]);

  constructor(
    private readonly clasificador: ClasificadorAgenda<T>,
    private readonly coincideBusqueda: (row: T, queryLower: string) => boolean,
    readonly etiquetas: Partial<Record<FiltroAgenda, string>> = {}
  ) {}

  vistaSecciones(query: string): boolean {
    return this.filtro === 'pendientes' && !String(query || '').trim();
  }

  tituloPlana(query: string): string {
    if (String(query || '').trim()) return 'Resultados';
    return this.etiquetas[this.filtro] || FILTROS_AGENDA.find((f) => f.id === this.filtro)?.label || '';
  }

  /** Todas las filas visibles ahora (para CSV o conteos). */
  get visibles(): T[] {
    return this.secciones.length ? this.secciones.flatMap((s) => s.filas) : this.plana.data;
  }

  aplicar(filas: T[], query: string, now: Date = new Date()): void {
    const c = this.clasificador;
    this.cuentas = contarFiltrosAgenda(filas, c);
    const secciones = seccionesPendientesAgenda(filas, c, { now });
    this.atrasados = secciones.find((s) => s.id === 'atrasados')?.filas.length || 0;
    this.hoy = secciones.find((s) => s.id === 'hoy')?.filas.length || 0;

    if (this.vistaSecciones(query)) {
      this.secciones = secciones.map((s) => ({ ...s, ds: new MatTableDataSource<T>(s.filas) }));
      this.plana.data = [];
      return;
    }

    this.secciones = [];
    const base: FiltroAgenda = this.filtro === 'pendientes' ? 'todos' : this.filtro;
    let lista = filtrarAgenda(filas, base, c);
    const q = String(query || '').trim().toLowerCase();
    if (q) {
      lista = lista.filter((f) => this.coincideBusqueda(f, q));
    }
    this.plana.data = lista;
  }
}
