import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FILTROS_AGENDA, FiltroAgenda } from '../../core/utils/agenda-filtros.util';

/**
 * Fila de botones arriba de la lista (Citas, Peluquería, Pensión): Pendientes · Hechos ·
 * Por cobrar · Pagados · Todos, cada uno con su número. En celular se desliza de lado.
 */
@Component({
  selector: 'app-agenda-filtros',
  templateUrl: './agenda-filtros.component.html',
  styleUrls: ['./agenda-filtros.component.scss'],
})
export class AgendaFiltrosComponent {
  @Input() filtro: FiltroAgenda = 'pendientes';
  @Input() cuentas: Partial<Record<FiltroAgenda, number>> = {};
  /** Número de atrasados para resaltarlo en «Pendientes». */
  @Input() atrasados = 0;
  /** Etiquetas propias por módulo (ej. Pensión: «Finalizadas»). */
  @Input() etiquetas: Partial<Record<FiltroAgenda, string>> = {};
  @Output() filtroChange = new EventEmitter<FiltroAgenda>();

  readonly opciones = FILTROS_AGENDA;

  etiqueta(id: FiltroAgenda, label: string): string {
    return this.etiquetas[id] || label;
  }

  elegir(id: FiltroAgenda): void {
    if (id === this.filtro) return;
    this.filtro = id;
    this.filtroChange.emit(id);
  }
}
