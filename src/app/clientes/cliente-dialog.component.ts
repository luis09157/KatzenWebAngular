import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cliente-dialog',
  templateUrl: './cliente-dialog.component.html',
  styleUrls: ['./cliente-dialog.component.css']
})
export class ClienteDialogComponent implements OnInit {
  clienteForm: FormGroup;
  modoVer: boolean = false;
  codigosPostales: any = {};
  coloniasDisponibles: any[] = [];
  mostrarSelectorColonias: boolean = false;


  constructor(
    public dialogRef: MatDialogRef<ClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient
  ) {
    this.modoVer = data.modoVer;
    this.clienteForm = this.fb.group({
      id: [data.cliente?.id || ''],
      nombre: [data.cliente?.nombre || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidoPaterno: [data.cliente?.apellidoPaterno || '', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      apellidoMaterno: [data.cliente?.apellidoMaterno || '', [Validators.minLength(2), Validators.maxLength(50)]],
      genero: [data.cliente?.genero || '', [Validators.required]],
      telefono: [data.cliente?.telefono || '', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      calle: [data.cliente?.calle || '', [Validators.minLength(3), Validators.maxLength(100)]],
      numero: [data.cliente?.numero || '', [Validators.maxLength(10)]],
      colonia: [data.cliente?.colonia || '', [Validators.minLength(2), Validators.maxLength(50)]],
      municipio: [data.cliente?.municipio || '', [Validators.minLength(2), Validators.maxLength(50)]],
      codigoPostal: [data.cliente?.codigoPostal || '', [Validators.pattern('^[0-9]{5}$')]],
      expediente: [data.cliente?.expediente || '', [Validators.maxLength(20)]],
      correo: [data.cliente?.correo || '', [Validators.email]],
      imageUrl: [data.cliente?.imageUrl || ''],
      urlGoogleMaps: [data.cliente?.urlGoogleMaps || '', [Validators.pattern('^https?://.*')]]
    });
    if (this.modoVer) {
      this.clienteForm.disable();
    }
  }

  ngOnInit() {
    this.cargarCodigosPostales();
    this.setupCodigoPostalListener();
  }

  cargarCodigosPostales() {
    this.http.get<any>('assets/codigos/codigospostales_limpio.json').subscribe(
      (data) => {
        this.codigosPostales = data;
        console.log('Códigos postales cargados:', Object.keys(this.codigosPostales).length);
      },
      (error) => {
        console.error('Error al cargar códigos postales:', error);
      }
    );
  }

  setupCodigoPostalListener() {
    this.clienteForm.get('codigoPostal')?.valueChanges.subscribe(codigo => {
      if (codigo && codigo.length === 5) {
        this.autocompletarDireccion(codigo);
      }
    });
  }

  autocompletarDireccion(codigoPostal: string) {
    const colonias = this.codigosPostales[codigoPostal];
    
    if (colonias && colonias.length > 0) {
      console.log('Código postal encontrado:', codigoPostal);
      console.log('Colonias disponibles:', colonias);
      
      this.coloniasDisponibles = colonias;
      
      if (colonias.length === 1) {
        // Si solo hay una colonia, autocompletar directamente
        const colonia = colonias[0];
        this.clienteForm.patchValue({
          colonia: colonia.colonia || '',
          municipio: colonia.municipio || colonia.d_mnpio || '',
        });
        this.mostrarSelectorColonias = false;
      } else {
        // Si hay múltiples colonias, mostrar selector
        this.mostrarSelectorColonias = true;
        // Limpiar campos de dirección para que el usuario seleccione
        this.clienteForm.patchValue({
          colonia: '',
          municipio: colonias[0].municipio || colonias[0].d_mnpio || '',
        });
      }
    } else {
      console.log('Código postal no encontrado:', codigoPostal);
      this.mostrarSelectorColonias = false;
      this.coloniasDisponibles = [];
    }
  }

  seleccionarColonia(colonia: any) {
    this.clienteForm.patchValue({
      colonia: colonia.colonia || '',
      municipio: colonia.municipio || colonia.d_mnpio || '',
    });
    this.mostrarSelectorColonias = false;
  }



  onCodigoPostalInput(event: any) {
    const codigo = event.target.value;
    if (codigo && codigo.length === 5) {
      this.autocompletarDireccion(codigo);
    }
  }

  guardar() {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.clienteForm.controls).forEach(key => {
      const control = this.clienteForm.get(key);
      control?.markAsTouched();
    });

    if (this.clienteForm.valid) {
      // Generar fecha de primera visita automáticamente
      const fechaPrimeraVisita = new Date().toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      
      const clienteData = {
        ...this.clienteForm.value,
        fecha: fechaPrimeraVisita
      };
      
      this.dialogRef.close(clienteData);
    } else {
      console.log('Formulario inválido:', this.clienteForm.errors);
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.clienteForm.get(fieldName);
    if (field?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (field?.hasError('minlength')) {
      const requiredLength = field.errors?.['minlength']?.requiredLength;
      return `Mínimo ${requiredLength} caracteres`;
    }
    if (field?.hasError('maxlength')) {
      const requiredLength = field.errors?.['maxlength']?.requiredLength;
      return `Máximo ${requiredLength} caracteres`;
    }
    if (field?.hasError('pattern')) {
      switch (fieldName) {
        case 'telefono':
          return 'Debe tener exactamente 10 dígitos';
        case 'codigoPostal':
          return 'Debe tener exactamente 5 dígitos';
        case 'correo':
          return 'Formato de correo inválido';
        case 'urlGoogleMaps':
          return 'Debe ser una URL válida (http:// o https://)';
        default:
          return 'Formato inválido';
      }
    }
    if (fieldName === 'genero' && field?.hasError('required')) {
      return 'Debe seleccionar un género';
    }
    if (field?.hasError('email')) {
      return 'Formato de correo electrónico inválido';
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.clienteForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  soloNumeros(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  cerrar() {
    this.dialogRef.close();
  }
} 