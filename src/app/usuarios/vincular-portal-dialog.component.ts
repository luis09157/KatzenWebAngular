import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/compat/database';

export interface VincularPortalDialogData {
  staffUid: string;
  staffNombre: string;
  staffCorreo: string;
}

export interface ClienteOption {
  id: string;
  label: string;
  correo: string;
}

@Component({
  selector: 'app-vincular-portal-dialog',
  templateUrl: './vincular-portal-dialog.component.html',
  styleUrls: ['./vincular-portal-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VincularPortalDialogComponent implements OnInit {
  form: FormGroup;
  loading = true;
  clientes: ClienteOption[] = [];
  filtered: ClienteOption[] = [];
  filterText = '';

  constructor(
    public dialogRef: MatDialogRef<VincularPortalDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VincularPortalDialogData,
    private fb: FormBuilder,
    private db: AngularFireDatabase
  ) {
    this.form = this.fb.group({
      clienteId: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const snap = await firstValueFrom(
        this.db.object<Record<string, Record<string, unknown>>>('Katzen/Cliente').valueChanges().pipe(take(1))
      );
      const rows: ClienteOption[] = [];
      if (snap) {
        for (const [id, c] of Object.entries(snap)) {
          if (!c || c['activo'] === false) continue;
          const nombre = [c['nombre'], c['apellidoPaterno'], c['apellidoMaterno']]
            .filter(Boolean)
            .join(' ')
            .trim() || 'Sin nombre';
          const correo = String(c['correo'] || '').trim();
          rows.push({ id, label: nombre, correo });
        }
      }
      rows.sort((a, b) => a.label.localeCompare(b.label, 'es'));
      this.clientes = rows;
      this.filtered = rows;
    } finally {
      this.loading = false;
    }
  }

  aplicarFiltro(value: string): void {
    this.filterText = value.trim().toLowerCase();
    if (!this.filterText) {
      this.filtered = this.clientes;
      return;
    }
    this.filtered = this.clientes.filter(c =>
      `${c.label} ${c.correo} ${c.id}`.toLowerCase().includes(this.filterText)
    );
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close({
      staffUid: this.data.staffUid,
      clienteId: this.form.value.clienteId
    });
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
