import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-cliente-dialog',
  templateUrl: './cliente-dialog.component.html',
  styleUrls: ['./cliente-dialog.component.css']
})
export class ClienteDialogComponent {
  clienteForm: FormGroup;
  modoVer: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.modoVer = data.modoVer;
    this.clienteForm = this.fb.group({
      id: [data.cliente?.id || ''],
      nombre: [data.cliente?.nombre || '', Validators.required],
      apellidoPaterno: [data.cliente?.apellidoPaterno || '', Validators.required],
      apellidoMaterno: [data.cliente?.apellidoMaterno || ''],
      telefono: [data.cliente?.telefono || '', Validators.required],
      calle: [data.cliente?.calle || ''],
      numero: [data.cliente?.numero || ''],
      colonia: [data.cliente?.colonia || ''],
      municipio: [data.cliente?.municipio || ''],
      expediente: [data.cliente?.expediente || ''],
      correo: [data.cliente?.correo || ''],
      fecha: [data.cliente?.fecha || ''],
      imageUrl: [data.cliente?.imageUrl || ''],
      urlGoogleMaps: [data.cliente?.urlGoogleMaps || '']
    });
    if (this.modoVer) {
      this.clienteForm.disable();
    }
  }

  guardar() {
    if (this.clienteForm.valid) {
      this.dialogRef.close(this.clienteForm.value);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
} 