import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Proveedor, ProveedorFormData } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

@Component({
  selector: 'app-proveedor-dialog',
  templateUrl: './proveedor-dialog.component.html',
  styleUrls: ['./proveedor-dialog.component.css']
})
export class ProveedorDialogComponent implements OnInit {
  proveedorForm: FormGroup;
  loading = false;
  isEditing = false;
  proveedor: Proveedor | null = null;

  categoriasProductos = [
    'Medicamentos',
    'Vacunas',
    'Alimentos',
    'Accesorios',
    'Higiene y Limpieza',
    'Equipamiento Médico',
    'Material Quirúrgico',
    'Suplementos',
    'Antiparasitarios',
    'Otros'
  ];

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<ProveedorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { proveedor: Proveedor | null },
    private errorMessages: ErrorMessagesService
  ) {
    this.proveedor = data.proveedor;
    this.isEditing = !!this.proveedor;

    this.proveedorForm = this.fb.group({
      razon_social: ['', [Validators.required, Validators.minLength(3)]],
      nombre_comercial: ['', [Validators.required, Validators.minLength(3)]],
      rfc: ['', [Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)]],
      direccion: ['', Validators.required],
      ciudad: ['', Validators.required],
      estado: ['', Validators.required],
      codigo_postal: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      contacto_nombre: ['', Validators.required],
      contacto_telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      contacto_email: ['', [Validators.required, Validators.email]],
      productos_suministra: [[]],
      dias_entrega: [7, [Validators.min(1), Validators.max(180)]],
      condiciones_pago: ['contado'],
      calificacion: [5, [Validators.min(1), Validators.max(5)]],
      activo: [true]
    });
  }

  ngOnInit(): void {
    if (this.isEditing && this.proveedor) {
      console.log('✏️ Editando proveedor:', this.proveedor.nombre_comercial);
      this.proveedorForm.patchValue(this.proveedor);
    } else {
      console.log('➕ Nuevo proveedor');
    }
  }

  agregarProducto(event: any): void {
    const value = event.value?.trim();
    if (value) {
      const productos = this.proveedorForm.get('productos_suministra')?.value || [];
      if (!productos.includes(value)) {
        productos.push(value);
        this.proveedorForm.patchValue({ productos_suministra: productos });
      }
    }
  }

  removerProducto(producto: string): void {
    const productos = this.proveedorForm.get('productos_suministra')?.value || [];
    const index = productos.indexOf(producto);
    if (index >= 0) {
      productos.splice(index, 1);
      this.proveedorForm.patchValue({ productos_suministra: productos });
    }
  }

  async guardar(): Promise<void> {
    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      Swal.fire('Formulario Incompleto', 'Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.loading = true;

    try {
      const formData: ProveedorFormData = this.proveedorForm.value;

      if (this.isEditing && this.proveedor?.id) {
        console.log('🔄 Actualizando proveedor...');
        await this.inventarioService.actualizarProveedor(this.proveedor.id, formData);
        console.log('✅ Proveedor actualizado');
        
        Swal.fire({
          icon: 'success',
          title: 'Proveedor Actualizado',
          text: `${formData.nombre_comercial} ha sido actualizado correctamente`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        console.log('🔄 Creando proveedor...');
        await this.inventarioService.crearProveedor(formData);
        console.log('✅ Proveedor creado');
        
        Swal.fire({
          icon: 'success',
          title: 'Proveedor Creado',
          text: `${formData.nombre_comercial} ha sido registrado correctamente`,
          timer: 2000,
          showConfirmButton: false
        });
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Error al guardar proveedor:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'guardar proveedor'), 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    if (this.proveedorForm.dirty) {
      Swal.fire({
        title: '¿Cancelar?',
        text: 'Los cambios no guardados se perderán',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cancelar',
        cancelButtonText: 'Continuar editando'
      }).then((result) => {
        if (result.isConfirmed) {
          this.dialogRef.close(false);
        }
      });
    } else {
      this.dialogRef.close(false);
    }
  }

  hasError(campo: string, error: string): boolean {
    const control = this.proveedorForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}

