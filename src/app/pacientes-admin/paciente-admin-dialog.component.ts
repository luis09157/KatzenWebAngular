import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ClientesService } from '../clientes/clientes.service';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-paciente-admin-dialog',
  templateUrl: './paciente-admin-dialog.component.html',
  styleUrls: ['./paciente-admin-dialog.component.css']
})
export class PacienteAdminDialogComponent implements OnInit {
  pacienteForm: FormGroup;
  isEditMode = false;
  isViewMode = false;
  loading = false;

  especies = ['CANINO', 'FELINO', 'AVE', 'REPTIL', 'OTRO'];
  sexos = ['Macho Entero', 'Macho Castrado', 'Hembra Entera', 'Hembra Esterilizada'];
  estados = ['Vivo', 'Fallecido'];

  // Variables para autocompletado de clientes
  clientes: any[] = [];
  filteredClientes: Observable<any[]>;
  maxDate = new Date(); // Fecha máxima: hoy
  
  // Propiedades para manejo de imagen
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress: number = 0;
  isUploading = false;
  defaultImageUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik03NSA0MEM2NS4wNTc2IDQwIDU3IDQ4LjA1NzYgNTcgNThDNTcgNjcuOTQyNCA2NS4wNTc2IDc2IDc1IDc2Qzg0Ljk0MjQgNzYgOTMgNjcuOTQyNCA5MyA1OEM5MyA0OC4wNTc2IDg0Ljk0MjQgNDAgNzUgNDBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik03NSA4MEM2NS4wNTc2IDgwIDU3IDg4LjA1NzYgNTcgOThDNTcgMTA3Ljk0MiA2NS4wNTc2IDExNiA3NSAxMTZDODQuOTQyNCAxMTYgOTMgMTA3Ljk0MiA5MyA5OEM5MyA4OC4wNTc2IDg0Ljk0MjQgODAgNzUgODBaIiBmaWxsPSIjQ0NDQ0NDIi8+CjxwYXRoIGQ9Ik03NSAxMjBDNjUuMDU3NiAxMjAgNTcgMTI4LjA1OCA1NyAxMzhDNTcgMTQ3Ljk0MiA2NS4wNTc2IDE1NiA3NSAxNTZDODQuOTQyNCAxNTYgOTMgMTQ3Ljk0MiA5MyAxMzhDOTMgMTI4LjA1OCA4NC45NDI0IDEyMCA3NSAxMjBaIiBmaWxsPSIjQ0NDQ0NDIi8+Cjwvc3ZnPgo='; // Ícono de huellita por defecto en base64

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PacienteAdminDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private clientesService: ClientesService,
    private storage: AngularFireStorage
  ) {
              this.pacienteForm = this.fb.group({
            nombre: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            especie: ['', Validators.required],
            raza: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
            sexo: ['', Validators.required],
            estado: ['Vivo', Validators.required], // Campo de estado con valor por defecto 'Vivo'
            edad: [''],
            color: ['', [Validators.maxLength(30)]],
            peso: ['', [Validators.pattern(/^\d*\.?\d*$/), Validators.min(0), Validators.max(200)]],
            idCliente: [''], // Sin validación visible, se llena automáticamente
            nombreCliente: ['', Validators.required]
          });
  }

  ngOnInit() {
    console.log('🚀 PacienteAdminDialogComponent ngOnInit iniciado');
    this.cargarClientes();
    this.setupDateValidation();
    
    if (this.data && this.data.paciente) {
      console.log('🔍 Datos recibidos en el diálogo:', this.data);
      
      // Detectar el modo
      if (this.data.modo === 'ver') {
        this.isViewMode = true;
        this.isEditMode = false;
      } else {
        this.isEditMode = true;
        this.isViewMode = false;
      }
      
      // Preparar los datos del paciente, convirtiendo la fecha si es necesario
      const pacienteData = { ...this.data.paciente };
      console.log('🔍 Datos originales del paciente:', pacienteData);
      
      let fechaConvertida: Date | null = null;
      if (pacienteData.edad && typeof pacienteData.edad === 'string') {
        console.log('📅 Convirtiendo fecha string:', pacienteData.edad);
        fechaConvertida = this.convertirFechaStringADate(pacienteData.edad);
        console.log('📅 Fecha convertida:', fechaConvertida);
      } else {
        console.log('⚠️ No se encontró campo edad o no es string:', pacienteData.edad);
      }
      
      // Primero asignar todos los datos excepto la fecha
      delete pacienteData.edad;
      console.log('🔍 Datos del paciente antes de patchValue:', pacienteData);
      this.pacienteForm.patchValue(pacienteData);
      
      // Luego asignar la fecha específicamente con setTimeout para asegurar que el datepicker esté listo
      if (fechaConvertida) {
        setTimeout(() => {
          console.log('📅 Asignando fecha al formulario:', fechaConvertida);
          this.pacienteForm.get('edad')?.setValue(fechaConvertida);
          
          // Verificar que la fecha se asignó correctamente
          const edadValue = this.pacienteForm.get('edad')?.value;
          console.log('📅 Valor final del campo edad:', edadValue);
          
          // Forzar detección de cambios
          this.pacienteForm.get('edad')?.markAsTouched();
          this.pacienteForm.get('edad')?.updateValueAndValidity();
        }, 200); // Aumenté el timeout a 200ms
      }
      
      // Cargar imagen existente si el paciente tiene una
      if (this.data.paciente.imageUrl && this.data.paciente.imageUrl !== this.defaultImageUrl) {
        this.imagePreview = this.data.paciente.imageUrl;
      }
    } else {
      console.log('⚠️ No se recibieron datos del paciente');
    }
  }

  setupDateValidation() {
    // Obtener la fecha de hoy
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Fin del día de hoy
    
    // Validar que la fecha no sea futura
    this.pacienteForm.get('edad')?.valueChanges.subscribe(date => {
      if (date && date > today) {
        this.pacienteForm.get('edad')?.setErrors({ futureDate: true });
      }
    });
  }

  cargarClientes() {
    this.clientesService.getClientes().subscribe(clientes => {
      this.clientes = clientes || [];
      this.setupAutocomplete();
    });
  }

  setupAutocomplete() {
    this.filteredClientes = this.pacienteForm.get('nombreCliente')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filterClientes(value))
    );
  }

  private _filterClientes(value: string): any[] {
    const filterValue = value.toLowerCase();
    return this.clientes.filter(cliente => {
      // Buscar por nombre completo
      const nombreCompleto = this.getNombreCompleto(cliente);
      
      // Buscar en campos individuales también
      const nombre = (cliente.nombre || '').toLowerCase();
      const apellidoPaterno = (cliente.apellidoPaterno || '').toLowerCase();
      const apellidoMaterno = (cliente.apellidoMaterno || '').toLowerCase();
      const apellido = (cliente.apellido || '').toLowerCase();
      const telefono = (cliente.telefono || '').toLowerCase();
      
      return nombreCompleto.toLowerCase().includes(filterValue) ||
             nombre.includes(filterValue) ||
             apellidoPaterno.includes(filterValue) ||
             apellidoMaterno.includes(filterValue) ||
             apellido.includes(filterValue) ||
             telefono.includes(filterValue);
    });
  }

  getNombreCompleto(cliente: any): string {
    let nombreCompleto = '';
    
    if (cliente.nombre) {
      nombreCompleto += cliente.nombre;
    }
    
    if (cliente.apellidoPaterno) {
      nombreCompleto += ' ' + cliente.apellidoPaterno;
    }
    
    if (cliente.apellidoMaterno) {
      nombreCompleto += ' ' + cliente.apellidoMaterno;
    }
    
    // Si no hay apellidos específicos, usar el campo apellido genérico
    if (!cliente.apellidoPaterno && !cliente.apellidoMaterno && cliente.apellido) {
      nombreCompleto += ' ' + cliente.apellido;
    }
    
    if (cliente.telefono) {
      nombreCompleto += ` (${cliente.telefono})`;
    }
    
    return nombreCompleto.trim();
  }

  onClienteSelected(cliente: any) {
    const nombreCompleto = this.getNombreCompleto(cliente);
    this.pacienteForm.patchValue({
      idCliente: cliente.id,
      nombreCliente: nombreCompleto
    });
  }

  async onSubmit() {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.pacienteForm.controls).forEach(key => {
      const control = this.pacienteForm.get(key);
      control?.markAsTouched();
    });

    // Validar que se haya seleccionado un cliente
    if (!this.pacienteForm.get('idCliente')?.value) {
      Swal.fire('Error', 'Debe seleccionar un cliente', 'error');
      return;
    }
    
    // Validar fecha futura
    const edadField = this.pacienteForm.get('edad');
    if (edadField?.value && edadField?.hasError('futureDate')) {
      Swal.fire('Error', 'La fecha de nacimiento no puede ser posterior a hoy', 'error');
      return;
    }
    
    if (this.pacienteForm.valid) {
      this.loading = true;
      
      try {
        let imageUrl = this.data?.paciente?.imageUrl || this.defaultImageUrl;
        
        // Solo subir nueva imagen si se seleccionó una
        if (this.selectedFile) {
          console.log('🔄 Subiendo nueva imagen en modo:', this.isViewMode ? 'ver' : 'editar');
          imageUrl = await this.uploadImage();
        }
        
        // Obtener los valores del formulario
        const formValues = this.pacienteForm.value;
        
        // Convertir la fecha de vuelta al formato string si existe
        if (formValues.edad && formValues.edad instanceof Date) {
          formValues.edad = this.convertirDateAString(formValues.edad);
        }
        
        const pacienteData = {
          ...formValues,
          imageUrl: imageUrl,
          imageFileName: this.selectedFile ? this.selectedFile.name : (this.data?.paciente?.imageFileName || ''),
          fecha: new Date().toLocaleString('es-ES')
        };
        
        if (this.isEditMode || this.isViewMode) {
          // Lógica para editar (tanto en modo editar como ver)
          console.log('✅ Paciente actualizado correctamente en modo:', this.isViewMode ? 'ver' : 'editar');
          Swal.fire('¡Éxito!', 'Paciente actualizado correctamente', 'success');
        } else {
          // Lógica para crear
          console.log('✅ Paciente creado correctamente');
          Swal.fire('¡Éxito!', 'Paciente creado correctamente', 'success');
        }
        
        this.dialogRef.close(pacienteData);
      } catch (error) {
        console.error('❌ Error al procesar el formulario:', error);
        Swal.fire('Error', 'Ocurrió un error al procesar el formulario', 'error');
      } finally {
        this.loading = false;
      }
    } else {
      // Mostrar mensaje de error general
      Swal.fire('Error', 'Por favor, complete todos los campos requeridos correctamente', 'error');
    }
  }

  onCancel() {
    this.dialogRef.close();
  }

  // Métodos para obtener mensajes de error
  getErrorMessage(fieldName: string): string {
    const field = this.pacienteForm.get(fieldName);
    
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
      return 'Formato inválido';
    }
    
    if (field?.hasError('min')) {
      return 'El valor mínimo es 0';
    }
    
    if (field?.hasError('max')) {
      return 'El valor máximo es 200 kg';
    }
    
    if (field?.hasError('futureDate')) {
      return 'La fecha no puede ser posterior a hoy';
    }
    
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.pacienteForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // Métodos para manejo de imagen
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Solo se permiten archivos de imagen', 'error');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', 'La imagen no puede ser mayor a 5MB', 'error');
        return;
      }
      
      this.selectedFile = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async uploadImage(): Promise<string> {
    if (!this.selectedFile) {
      throw new Error('No hay archivo seleccionado');
    }

    this.isUploading = true;
    this.uploadProgress = 0;

    const fileId = Date.now() + '_' + Math.random().toString(36).substring(2);
    const filePath = `Mascotas/${fileId}`;
    const fileRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, this.selectedFile);

    // Monitorear progreso
    uploadTask.percentageChanges().subscribe(percentage => {
      this.uploadProgress = percentage || 0;
    });

    try {
      const snapshot = await uploadTask.snapshotChanges().pipe(
        finalize(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
        })
      ).toPromise();
      
      const downloadURL = await fileRef.getDownloadURL().toPromise();
      return downloadURL;
    } catch (error) {
      console.error('Error al subir imagen:', error);
      Swal.fire('Error', 'No se pudo subir la imagen', 'error');
      this.isUploading = false;
      this.uploadProgress = 0;
      throw error;
    }
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
  }

  // Función para convertir fecha en formato string (dd/mm/yyyy) a objeto Date
  convertirFechaStringADate(fechaString: string): Date | null {
    if (!fechaString) {
      console.log('❌ Fecha string vacía');
      return null;
    }
    
    console.log('🔄 Convirtiendo fecha:', fechaString);
    
    try {
      const partes = fechaString.split('/');
      console.log('📅 Partes de la fecha:', partes);
      
      if (partes.length !== 3) {
        console.log('❌ Formato de fecha inválido, se esperaban 3 partes');
        return null;
      }
      
      const dia = parseInt(partes[0]);
      const mes = parseInt(partes[1]) - 1; // Los meses en JS van de 0 a 11
      const año = parseInt(partes[2]);
      
      console.log('📅 Dia:', dia, 'Mes:', mes, 'Año:', año);
      
      const fecha = new Date(año, mes, dia);
      
      // Verificar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        console.log('❌ Fecha inválida después de crear Date object');
        return null;
      }
      
      console.log('✅ Fecha convertida exitosamente:', fecha);
      return fecha;
    } catch (error) {
      console.error('❌ Error al convertir fecha:', error);
      return null;
    }
  }

  // Función para convertir Date a string en formato dd/mm/yyyy
  convertirDateAString(fecha: Date): string {
    if (!fecha || !(fecha instanceof Date) || isNaN(fecha.getTime())) {
      return '';
    }
    
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    
    return `${dia}/${mes}/${año}`;
  }
} 