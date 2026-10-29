/**
 * Spec 116.1 — galería de fotos y estudios de una consulta (solo lectura).
 * Fotos → miniaturas; al tocar se abren en grande. PDF → renglón con «Ver».
 */
import { ChangeDetectionStrategy, Component, Inject, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { esImagenArchivoHistorial, nombreVisibleArchivo, normalizarArchivosHistorial } from './historial-archivos.util';

export interface FotoVisorData {
  fotos: string[];
  indice: number;
}

@Component({
  selector: 'app-foto-visor-dialog',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="foto-visor" (keydown.arrowleft)="mover(-1)" (keydown.arrowright)="mover(1)" tabindex="0">
      <div class="foto-visor__barra">
        <span class="foto-visor__cuenta" *ngIf="data.fotos.length > 1">{{ indice + 1 }} de {{ data.fotos.length }}</span>
        <span class="foto-visor__espacio"></span>
        <a mat-icon-button [href]="actual" target="_blank" rel="noopener noreferrer" aria-label="Abrir en otra pestaña">
          <mat-icon>open_in_new</mat-icon>
        </a>
        <button mat-icon-button type="button" (click)="cerrar()" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
      <div class="foto-visor__imagen">
        <button
          *ngIf="data.fotos.length > 1"
          mat-icon-button
          type="button"
          class="foto-visor__flecha foto-visor__flecha--izq"
          (click)="mover(-1)"
          aria-label="Foto anterior"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <img [src]="actual" alt="Foto de la consulta" />
        <button
          *ngIf="data.fotos.length > 1"
          mat-icon-button
          type="button"
          class="foto-visor__flecha foto-visor__flecha--der"
          (click)="mover(1)"
          aria-label="Foto siguiente"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .foto-visor-panel .mat-mdc-dialog-surface {
        background: #111 !important;
        border-radius: 0 !important;
      }
      .foto-visor {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
        background: #111;
        color: #fff;
        outline: none;
      }
      .foto-visor__barra {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 8px;
      }
      .foto-visor__barra .mat-icon {
        color: #fff;
      }
      .foto-visor__cuenta {
        font-size: 0.9rem;
        padding-left: 8px;
      }
      .foto-visor__espacio {
        flex: 1;
      }
      .foto-visor__imagen {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
        padding: 0 8px 12px;
      }
      .foto-visor__imagen img {
        max-width: 100%;
        max-height: calc(100vh - 90px);
        object-fit: contain;
      }
      .foto-visor__flecha {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.45) !important;
      }
      .foto-visor__flecha .mat-icon {
        color: #fff;
      }
      .foto-visor__flecha--izq {
        left: 8px;
      }
      .foto-visor__flecha--der {
        right: 8px;
      }
    `,
  ],
})
export class FotoVisorDialogComponent {
  indice: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FotoVisorData,
    private ref: MatDialogRef<FotoVisorDialogComponent>
  ) {
    this.indice = Math.min(Math.max(0, data.indice || 0), Math.max(0, data.fotos.length - 1));
  }

  get actual(): string {
    return this.data.fotos[this.indice] || '';
  }

  mover(paso: number): void {
    const n = this.data.fotos.length;
    if (n < 2) return;
    this.indice = (this.indice + paso + n) % n;
  }

  cerrar(): void {
    this.ref.close();
  }
}

/** Abre una foto en grande (pantalla completa en celular). */
export function abrirVisorFotos(dialog: MatDialog, fotos: string[], indice: number): void {
  if (!fotos.length) return;
  dialog.open(FotoVisorDialogComponent, {
    data: { fotos, indice } as FotoVisorData,
    width: '100vw',
    maxWidth: '100vw',
    height: '100vh',
    maxHeight: '100vh',
    panelClass: 'foto-visor-panel',
    autoFocus: 'first-tabbable',
  });
}

@Component({
  selector: 'app-fotos-expediente',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fotos-exp" *ngIf="fotos.length || otros.length" [class.fotos-exp--compacto]="compacto">
      <div class="fotos-exp__grid" *ngIf="fotos.length">
        <button
          type="button"
          class="fotos-exp__mini"
          *ngFor="let f of fotos; let i = index"
          (click)="verFoto(i)"
          [attr.aria-label]="'Ver foto ' + (i + 1)"
        >
          <img [src]="f" alt="" loading="lazy" />
        </button>
      </div>
      <div class="fotos-exp__otros" *ngIf="otros.length">
        <a
          class="fotos-exp__doc"
          *ngFor="let a of otros; let i = index"
          [href]="a"
          target="_blank"
          rel="noopener noreferrer"
        >
          <mat-icon>picture_as_pdf</mat-icon>
          <span>{{ nombre(a, i) }}</span>
          <mat-icon class="fotos-exp__doc-abrir">open_in_new</mat-icon>
        </a>
      </div>
    </div>
  `,
  styles: [
    `
      .fotos-exp {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .fotos-exp__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
        gap: 8px;
      }
      .fotos-exp--compacto .fotos-exp__grid {
        grid-template-columns: repeat(auto-fill, minmax(64px, 72px));
        gap: 6px;
      }
      .fotos-exp__mini {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        padding: 0;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        overflow: hidden;
        background: #f3f4f6;
        cursor: zoom-in;
      }
      .fotos-exp__mini img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .fotos-exp__otros {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .fotos-exp__doc {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 44px;
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #f9fafb;
        color: #111827;
        text-decoration: none;
        font-size: 0.875rem;
        font-weight: 600;
        min-width: 0;
      }
      .fotos-exp__doc span {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .fotos-exp__doc .mat-icon {
        color: #b91c1c;
        flex-shrink: 0;
      }
      .fotos-exp__doc .fotos-exp__doc-abrir {
        color: #065d60;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class FotosExpedienteComponent {
  fotos: string[] = [];
  otros: string[] = [];

  /** Valor guardado en `historial.archivos` (cualquier formato). */
  @Input() set archivos(valor: unknown) {
    const lista = normalizarArchivosHistorial(valor);
    this.fotos = lista.filter((u) => esImagenArchivoHistorial(u));
    this.otros = lista.filter((u) => !esImagenArchivoHistorial(u));
  }

  /** Miniaturas más chicas (lista de la ficha). */
  @Input() compacto = false;

  constructor(private dialog: MatDialog) {}

  verFoto(i: number): void {
    abrirVisorFotos(this.dialog, this.fotos, i);
  }

  nombre(url: string, i: number): string {
    return nombreVisibleArchivo(url, i);
  }
}
