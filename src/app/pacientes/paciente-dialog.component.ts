import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-paciente-dialog',
  templateUrl: './paciente-dialog.component.html',
  styleUrls: ['./paciente-dialog.component.css']
})
export class PacienteDialogComponent {
  pacienteForm: FormGroup;
  modoVer: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<PacienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.modoVer = data.modoVer;
    this.pacienteForm = this.fb.group({
      id: [data.paciente?.id || ''],
      nombre: [data.paciente?.nombre || '', Validators.required],
      especie: [data.paciente?.especie || '', Validators.required],
      raza: [data.paciente?.raza || ''],
      sexo: [data.paciente?.sexo || ''],
      edad: [data.paciente?.edad || ''],
      color: [data.paciente?.color || ''],
      peso: [data.paciente?.peso || ''],
      idCliente: [data.paciente?.idCliente || ''],
      nombreCliente: [data.paciente?.nombreCliente || ''],
      imageUrl: [data.paciente?.imageUrl || '']
    });
    if (this.modoVer) {
      this.pacienteForm.disable();
    }
  }

  guardar() {
    if (this.pacienteForm.valid) {
      this.dialogRef.close(this.pacienteForm.value);
    }
  }

  cerrar() {
    this.dialogRef.close();
  }
} 