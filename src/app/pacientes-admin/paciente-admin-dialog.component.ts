import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-paciente-admin-dialog',
  templateUrl: './paciente-admin-dialog.component.html',
  styleUrls: ['./paciente-admin-dialog.component.css']
})
export class PacienteAdminDialogComponent implements OnInit {
  pacienteForm: FormGroup;
  isEditMode = false;
  loading = false;

  especies = ['CANINO', 'FELINO', 'AVE', 'REPTIL', 'OTRO'];
  sexos = ['Macho Entero', 'Macho Castrado', 'Hembra Entera', 'Hembra Esterilizada'];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PacienteAdminDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.pacienteForm = this.fb.group({
      nombre: ['', Validators.required],
      especie: ['', Validators.required],
      raza: ['', Validators.required],
      sexo: ['', Validators.required],
      edad: [''],
      color: [''],
      peso: [''],
      idCliente: ['', Validators.required],
      nombreCliente: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (this.data && this.data.paciente) {
      this.isEditMode = true;
      this.pacienteForm.patchValue(this.data.paciente);
    }
  }

  onSubmit() {
    if (this.pacienteForm.valid) {
      this.loading = true;
      const pacienteData = this.pacienteForm.value;
      
      if (this.isEditMode) {
        // Lógica para editar
        Swal.fire('¡Éxito!', 'Paciente actualizado correctamente', 'success');
      } else {
        // Lógica para crear
        Swal.fire('¡Éxito!', 'Paciente creado correctamente', 'success');
      }
      
      this.dialogRef.close(pacienteData);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
} 