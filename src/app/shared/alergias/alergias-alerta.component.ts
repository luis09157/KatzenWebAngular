import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { normalizeAlergias } from './alergias.util';

@Component({
  selector: 'app-alergias-alerta',
  templateUrl: './alergias-alerta.component.html',
  styleUrls: ['./alergias-alerta.component.scss']
})
export class AlergiasAlertaComponent implements OnChanges {
  /** Lista ya normalizada, o raw (paciente / string / array). */
  @Input() alergias: unknown;
  @Input() titulo = 'Alergias registradas';
  @Input() mensaje =
    'Revisa productos, fármacos y materiales antes de continuar. Este aviso no bloquea el guardado.';

  lista: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alergias']) {
      this.lista = normalizeAlergias(this.alergias);
    }
  }

  get visible(): boolean {
    return this.lista.length > 0;
  }
}
