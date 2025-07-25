import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-usuario-dialog',
  templateUrl: './usuario-dialog.component.html',
  styleUrls: ['./usuario-dialog.component.css']
})
export class UsuarioDialogComponent {
  usuarioForm: FormGroup;
  modoVer: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<UsuarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.modoVer = data.modoVer;
    this.usuarioForm = this.fb.group({
      id: [data.usuario?.id || ''],
      nombre: [data.usuario?.nombre || '', Validators.required],
      email: [data.usuario?.email || '', [Validators.required, Validators.email]],
      rol: [data.usuario?.rol || 'admin', Validators.required]
    });
    if (this.modoVer) {
      this.usuarioForm.disable();
    }
  }

  guardar() {
    if (this.usuarioForm.valid) {
      this.dialogRef.close(this.usuarioForm.value);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
} 