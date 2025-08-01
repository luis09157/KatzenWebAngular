import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import Swal from 'sweetalert2';

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
  
  // Propiedades para carga de imágenes
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  defaultImageUrl: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTNzUuNTIgMiAxMiAyWk0xMiAyMEM3LjU4IDIwIDQgMTYuNDIgNCAxMlM3LjU4IDQgMTIgNFMyMCA3LjU4IDIwIDEyUzE2LjQyIDIwIDEyIDIwWiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMTIgNkM5Ljc5IDYgOCA3Ljc5IDggMTBTOS43OSAxNCAxMiAxNFMxNiAxMi4yMSAxNiAxMFMxNC4yMSA2IDEyIDZaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo=';


  constructor(
    public dialogRef: MatDialogRef<ClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private storage: AngularFireStorage
  ) {
    this.modoVer = data.modoVer;
    this.clienteForm = this.fb.group({
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
      imageFileName: [data.cliente?.imageFileName || ''],
      kilometrosCasa: [data.cliente?.kilometrosCasa || ''],
      urlGoogleMaps: [data.cliente?.urlGoogleMaps || '', [Validators.pattern('^https?://.*')]]
    });
    if (this.modoVer) {
      this.clienteForm.disable();
    }
  }

  ngOnInit() {
    this.cargarCodigosPostales();
    this.setupCodigoPostalListener();
    
    // Cargar imagen existente si estamos editando
    if (this.data?.cliente?.imageUrl && this.data.cliente.imageUrl !== this.defaultImageUrl) {
      this.imagePreview = this.data.cliente.imageUrl;
    }
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
    const value = event.target.value;
    if (value.length > 5) {
      event.target.value = value.slice(0, 5);
    }
  }

  async guardar() {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.clienteForm.controls).forEach(key => {
      const control = this.clienteForm.get(key);
      control?.markAsTouched();
    });

    if (this.clienteForm.valid) {
      try {
        let imageUrl = this.data?.cliente?.imageUrl || this.defaultImageUrl;
        
        // Si hay una nueva imagen seleccionada, subirla
        if (this.selectedFile) {
          console.log('🔄 Subiendo imagen del cliente...');
          imageUrl = await this.uploadImage();
          console.log('✅ Imagen subida exitosamente:', imageUrl);
        }
        
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
          id: this.data?.cliente?.id || '', // Solo incluir ID si estamos editando
          nombre: this.clienteForm.value.nombre,
          apellidoPaterno: this.clienteForm.value.apellidoPaterno,
          apellidoMaterno: this.clienteForm.value.apellidoMaterno,
          genero: this.clienteForm.value.genero,
          telefono: this.clienteForm.value.telefono,
          calle: this.clienteForm.value.calle,
          numero: this.clienteForm.value.numero,
          colonia: this.clienteForm.value.colonia,
          municipio: this.clienteForm.value.municipio,
          codigoPostal: this.clienteForm.value.codigoPostal,
          expediente: this.clienteForm.value.expediente,
          correo: this.clienteForm.value.correo,
          imageUrl: imageUrl,
          imageFileName: this.selectedFile ? this.selectedFile.name : (this.data?.cliente?.imageFileName || ''),
          kilometrosCasa: this.clienteForm.value.kilometrosCasa,
          urlGoogleMaps: this.clienteForm.value.urlGoogleMaps,
          fecha: fechaPrimeraVisita
        };
        
        this.dialogRef.close(clienteData);
      } catch (error) {
        console.error('❌ Error al procesar la imagen:', error);
        Swal.fire('Error', 'No se pudo procesar la imagen. Intenta de nuevo.', 'error');
      }
    } else {
      console.log('Formulario inválido:', this.clienteForm.errors);
      Swal.fire('Error', 'Por favor, completa todos los campos requeridos correctamente', 'error');
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        Swal.fire('Error', 'Por favor selecciona solo archivos de imagen', 'error');
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
    
    const fileName = `${Date.now()}_${this.selectedFile.name}`;
    const filePath = `Clientes/${fileName}`;
    const fileRef = this.storage.ref(filePath);
    
    const uploadTask = this.storage.upload(filePath, this.selectedFile);
    
    return new Promise((resolve, reject) => {
      uploadTask.percentageChanges().subscribe(percentage => {
        this.uploadProgress = percentage || 0;
      });
      
      uploadTask.snapshotChanges().subscribe(
        (snapshot) => {
          if (snapshot.state === 'running') {
            this.isUploading = true;
          } else if (snapshot.state === 'success') {
            this.isUploading = false;
            fileRef.getDownloadURL().subscribe(url => {
              resolve(url);
            });
          }
        },
        (error) => {
          this.isUploading = false;
          reject(error);
        }
      );
    });
  }

  removeImage() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadProgress = 0;
  }

  cerrar() {
    this.dialogRef.close();
  }
} 