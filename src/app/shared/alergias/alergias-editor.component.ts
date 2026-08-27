import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { normalizeAlergias } from './alergias.util';

@Component({
  selector: 'app-alergias-editor',
  templateUrl: './alergias-editor.component.html',
  styleUrls: ['./alergias-editor.component.scss']
})
export class AlergiasEditorComponent implements OnChanges {
  @Input() alergias: string[] | unknown = [];
  @Input() readonly = false;
  @Input() placeholder = 'Ej. Penicilina, shampoo común…';
  @Output() alergiasChange = new EventEmitter<string[]>();

  lista: string[] = [];
  nueva = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['alergias']) {
      this.lista = normalizeAlergias(this.alergias);
    }
  }

  agregar(): void {
    if (this.readonly) return;
    const partes = normalizeAlergias(this.nueva);
    if (!partes.length) {
      this.nueva = '';
      return;
    }
    const next = normalizeAlergias([...this.lista, ...partes]);
    this.lista = next;
    this.nueva = '';
    this.alergiasChange.emit(next);
  }

  quitar(index: number): void {
    if (this.readonly) return;
    const next = this.lista.filter((_, i) => i !== index);
    this.lista = next;
    this.alergiasChange.emit(next);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.agregar();
    }
  }
}
