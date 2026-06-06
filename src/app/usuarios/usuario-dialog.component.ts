import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password && !confirm) {
    return null;
  }
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-usuario-dialog',
  templateUrl: './usuario-dialog.component.html',
  styleUrls: ['./usuario-dialog.component.css']
})
export class UsuarioDialogComponent implements OnInit {
  usuarioForm: FormGroup;
  modoVer: boolean = false;
  isEditMode: boolean = false;

  // Opciones para los selects
  perfiles = [
    { value: 'admin', label: 'Administrador', icon: 'admin_panel_settings' },
    { value: 'doctor', label: 'Doctor/Veterinario', icon: 'medical_services' },
    { value: 'peluquero', label: 'Peluquero', icon: 'content_cut' },
    { value: 'recepcionista', label: 'Recepcionista', icon: 'support_agent' }
  ];

  constructor(
    public dialogRef: MatDialogRef<UsuarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.modoVer = data.modoVer || false;
    this.isEditMode = !!data.usuario?.id;
  }

  ngOnInit() {
    this.usuarioForm = this.fb.group({
      id: [this.data.usuario?.id || ''],
      nombre: [this.data.usuario?.nombre || '', [Validators.required, Validators.minLength(2)]],
      correo: [this.data.usuario?.correo || '', [Validators.required, Validators.email]],
      telefono: [this.data.usuario?.telefono || '', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      perfil: [this.data.usuario?.perfil || 'doctor', Validators.required],
      activo: [this.data.usuario?.activo !== false ? true : false],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['']
    }, { validators: passwordsMatch });

    if (this.modoVer) {
      this.usuarioForm.disable();
    }
  }

  guardar() {
    if (this.usuarioForm.valid) {
      const formData = this.usuarioForm.value;

      // Agregar timestamp si es nuevo usuario
      if (!this.isEditMode) {
        formData.fecha_registro = new Date().toISOString();
        formData.created_by = 'system';
      }
      // El padre muestra el loading al recibir result; no mostrar aquí para evitar doble show
      this.dialogRef.close(formData);
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.usuarioForm.controls).forEach(key => {
        this.usuarioForm.get(key)?.markAsTouched();
      });
    }
  }

  cerrar() {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const field = this.usuarioForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (field.errors['email']) {
        return 'Formato de correo inválido';
      }
      if (field.errors['minlength']) {
        const min = field.errors['minlength'].requiredLength;
        if (fieldName === 'password') {
          return `La contraseña debe tener al menos ${min} caracteres`;
        }
        return `${this.getFieldLabel(fieldName)} debe tener al menos 2 caracteres`;
      }
      if (field.errors['pattern']) {
        return 'El teléfono debe tener 10 dígitos';
      }
    }
    if (fieldName === 'confirmPassword' && this.usuarioForm.errors?.['passwordMismatch'] && field?.touched) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'nombre': 'Nombre',
      'correo': 'Correo',
      'telefono': 'Teléfono',
      'perfil': 'Perfil'
    };
    return labels[fieldName] || fieldName;
  }
} 