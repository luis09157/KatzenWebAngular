import { Component, OnInit, Inject, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Proveedor, ProveedorFormData } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

@Component({
  selector: 'app-proveedor-dialog',
  templateUrl: './proveedor-dialog.component.html',
  styleUrls: ['./proveedor-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
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

    // Dirección/CP opcionales: el diálogo es alto y Cypress/Material
    // desincronizaban campos abajo del scroll → «Formulario incompleto».
    this.proveedorForm = this.fb.group({
      razon_social: ['', [Validators.required, Validators.minLength(3)]],
      nombre_comercial: ['', [Validators.required, Validators.minLength(3)]],
      rfc: ['', [Validators.pattern(/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/)]],
      direccion: [''],
      ciudad: [''],
      estado: [''],
      codigo_postal: ['', [Validators.pattern(/^\d{5}$/)]],
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

  /** Controles inválidos (para Swal y depuración E2E). */
  private invalidFieldLabels(): string[] {
    const labels: Record<string, string> = {
      razon_social: 'Razón social',
      nombre_comercial: 'Nombre comercial',
      rfc: 'RFC',
      codigo_postal: 'Código postal',
      contacto_nombre: 'Nombre del contacto',
      contacto_telefono: 'Teléfono (10 dígitos)',
      contacto_email: 'Email',
      dias_entrega: 'Días de entrega',
      calificacion: 'Calificación'
    };
    return Object.keys(this.proveedorForm.controls)
      .filter((key) => this.proveedorForm.get(key)?.invalid)
      .map((key) => labels[key] || key);
  }

  ngOnInit(): void {
    if (this.isEditing && this.proveedor) {
      this.hydrateFromProveedor(this.proveedor);
    }
  }

  /** Hidrata con defaults seguros (RTDB puede omitir campos legacy vacíos). */
  private hydrateFromProveedor(p: Proveedor): void {
    this.proveedorForm.patchValue({
      razon_social: p.razon_social || '',
      nombre_comercial: p.nombre_comercial || '',
      rfc: p.rfc || '',
      direccion: p.direccion || '',
      ciudad: p.ciudad || '',
      estado: p.estado || '',
      codigo_postal: p.codigo_postal || '',
      contacto_nombre: p.contacto_nombre || '',
      contacto_telefono: p.contacto_telefono || '',
      contacto_email: p.contacto_email || '',
      productos_suministra: p.productos_suministra || [],
      dias_entrega: p.dias_entrega ?? 7,
      condiciones_pago: p.condiciones_pago || 'contado',
      calificacion: p.calificacion ?? 5,
      activo: p.activo !== false
    });
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

  /**
   * Cypress / autofill a veces dejan el DOM lleno y el FormControl vacío
   * (MatInput no aplica el value accessor). Antes de validar, re-sincroniza.
   */
  private syncTextInputsFromDom(): void {
    const textControls = [
      'razon_social',
      'nombre_comercial',
      'rfc',
      'direccion',
      'ciudad',
      'estado',
      'codigo_postal',
      'contacto_nombre',
      'contacto_telefono',
      'contacto_email',
      'dias_entrega',
      'condiciones_pago'
    ];
    for (const name of textControls) {
      const control = this.proveedorForm.get(name);
      if (!control) continue;
      const el = document.querySelector(
        `app-proveedor-dialog input[formControlName="${name}"]`
      ) as HTMLInputElement | null;
      if (!el) continue;
      const domValue = el.value;
      const controlValue = control.value == null ? '' : String(control.value);
      // Solo DOM → control cuando el DOM trae valor (nunca pisar FormControl con vacío).
      if (domValue && domValue !== controlValue) {
        const next =
          name === 'dias_entrega' ? Number(domValue) : domValue;
        control.setValue(next, { emitEvent: true });
        control.markAsDirty();
        control.updateValueAndValidity({ emitEvent: false });
      }
    }
  }

  async guardar(): Promise<void> {
    this.syncTextInputsFromDom();
    // Edit: si el DOM no refleja aún el patchValue, rehidrata huecos desde el modelo.
    if (this.isEditing && this.proveedor) {
      const p = this.proveedor;
      const fillIfEmpty = (key: keyof Proveedor, controlName: string) => {
        const control = this.proveedorForm.get(controlName);
        if (!control) return;
        const cur = control.value == null ? '' : String(control.value).trim();
        const fromModel = p[key] == null ? '' : String(p[key]).trim();
        if (!cur && fromModel) {
          control.setValue(fromModel);
          control.updateValueAndValidity({ emitEvent: false });
        }
      };
      fillIfEmpty('razon_social', 'razon_social');
      fillIfEmpty('nombre_comercial', 'nombre_comercial');
      fillIfEmpty('contacto_nombre', 'contacto_nombre');
      fillIfEmpty('contacto_telefono', 'contacto_telefono');
      fillIfEmpty('contacto_email', 'contacto_email');
    }

    if (this.proveedorForm.invalid) {
      this.proveedorForm.markAllAsTouched();
      const faltantes = this.invalidFieldLabels();
      Swal.fire(
        'Formulario incompleto',
        faltantes.length
          ? `Revisa: ${faltantes.join(', ')}`
          : 'Completa todos los campos requeridos',
        'warning'
      );
      return;
    }

    this.loading = true;

    try {
      const raw = this.proveedorForm.getRawValue();
      const formData: ProveedorFormData = {
        razon_social: String(raw.razon_social || '').trim(),
        nombre_comercial: String(raw.nombre_comercial || '').trim(),
        rfc: String(raw.rfc || '').trim().toUpperCase(),
        contacto_nombre: String(raw.contacto_nombre || '').trim(),
        contacto_telefono: String(raw.contacto_telefono || '').trim(),
        contacto_email: String(raw.contacto_email || '').trim(),
        direccion: String(raw.direccion || '').trim(),
        ciudad: String(raw.ciudad || '').trim(),
        estado: String(raw.estado || '').trim(),
        codigo_postal: String(raw.codigo_postal || '').trim(),
        dias_entrega: Number(raw.dias_entrega) || 7,
        condiciones_pago: String(raw.condiciones_pago || 'contado').trim()
      };

      if (this.isEditing && this.proveedor?.id) {
        await this.inventarioService.actualizarProveedor(this.proveedor.id, {
          ...formData,
          productos_suministra: raw.productos_suministra || [],
          calificacion: Number(raw.calificacion) || 5,
          activo: raw.activo !== false
        });
        this.dialogRef.close(true);
        Swal.fire({
          icon: 'success',
          title: 'Proveedor actualizado',
          text: `${formData.nombre_comercial} se actualizó correctamente`,
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await this.inventarioService.crearProveedor(formData);
        this.dialogRef.close(true);
        Swal.fire({
          icon: 'success',
          title: 'Proveedor creado',
          text: `${formData.nombre_comercial} se registró correctamente`,
          timer: 2000,
          showConfirmButton: false
        });
      }
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

