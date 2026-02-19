import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ClientesService } from './clientes.service';
import { PacientesService } from '../pacientes/pacientes.service';
import { Observable, map } from 'rxjs';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../core/error-messages.service';
import { LoadingService } from '../core/loading.service';

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
  todosLosClientes: any[] = [];
  pacientesRelacionados: any[] = [];
  cargandoPacientes: boolean = false;
  
  // Propiedades para carga de imágenes
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  hasImageChanges: boolean = false;
  defaultImageUrl: string = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTNzUuNTIgMiAxMiAyWk0xMiAyMEM3LjU4IDIwIDQgMTYuNDIgNCAxMlM3LjU4IDQgMTIgNFMyMCA3LjU4IDIwIDEyUzE2LjQyIDIwIDEyIDIwWiIgZmlsbD0iIzk5OTk5OSIvPgo8cGF0aCBkPSJNMTIgNkM5Ljc5IDYgOCA3Ljc5IDggMTBTOS43OSAxNCAxMiAxNFMxNiAxMi4yMSAxNiAxMFMxNC4yMSA2IDEyIDZaIiBmaWxsPSIjOTk5OTk5Ii8+Cjwvc3ZnPgo=';

  constructor(
    public dialogRef: MatDialogRef<ClienteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private http: HttpClient,
    private storage: AngularFireStorage,
    private clientesService: ClientesService,
    private pacientesService: PacientesService,
    private errorMessages: ErrorMessagesService,
    private loadingService: LoadingService
  ) {
    this.modoVer = data.modoVer;
    const isEditMode = !!data.cliente?.id; // Verificar si estamos editando
    const tieneCorreo = !!data.cliente?.correo; // Verificar si ya tiene correo
    
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
      correo: [
        { 
          value: data.cliente?.correo || '', 
          disabled: isEditMode && tieneCorreo // Bloquear solo si está editando Y ya tiene correo
        }, 
        [Validators.email], 
        isEditMode ? [] : [this.emailUnicoValidator.bind(this)] // Solo validar si NO es edición
      ],
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
    this.cargarClientes();
    this.setupCodigoPostalListener();
    
    // Cargar imagen existente si estamos editando
    if (this.data?.cliente?.imageUrl && this.data.cliente.imageUrl !== this.defaultImageUrl) {
      this.imagePreview = this.data.cliente.imageUrl;
    }
    
    // Cargar pacientes relacionados si estamos en modo ver
    if (this.modoVer && this.data?.cliente?.id) {
      this.cargarPacientesRelacionados();
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

  emailUnicoValidator(control: AbstractControl): Observable<ValidationErrors | null> {
    const email = control.value;
    if (!email) {
      return new Observable(observer => observer.next(null));
    }

    return new Observable(observer => {
      // Esperar a que los clientes estén cargados
      if (this.todosLosClientes.length === 0) {
        console.log('⚠️ No hay clientes cargados aún, esperando...');
        // Esperar un poco y volver a intentar
        setTimeout(() => {
          this.emailUnicoValidator(control).subscribe(result => {
            observer.next(result);
            observer.complete();
          });
        }, 1000);
        return;
      }

      const clienteActual = this.data?.cliente;
      console.log('=== VALIDACIÓN DE EMAIL ===');
      console.log('Email a validar:', email);
      console.log('Cliente actual ID:', clienteActual?.id);
      console.log('Total clientes cargados:', this.todosLosClientes.length);
      
      // Filtrar clientes que no sean el actual
      const otrosClientes = this.todosLosClientes.filter(cliente => {
        const noEsActual = cliente.id !== clienteActual?.id;
        console.log(`Cliente ${cliente.id}: ${cliente.correo} - Es actual: ${!noEsActual}`);
        return noEsActual;
      });
      
      console.log('Clientes a comparar (excluyendo actual):', otrosClientes.length);
      
      const emailExiste = otrosClientes.some(cliente => {
        const tieneMismoEmail = cliente.correo && cliente.correo.toLowerCase() === email.toLowerCase();
        console.log(`Cliente ${cliente.id}: ${cliente.correo} - Mismo email: ${tieneMismoEmail}`);
        return tieneMismoEmail;
      });

      console.log('Resultado final - Email existe:', emailExiste);
      console.log('=== FIN VALIDACIÓN ===');

      if (emailExiste) {
        observer.next({ emailDuplicado: true });
      } else {
        observer.next(null);
      }
      observer.complete();
    });
  }

  async guardar() {
    console.log('🚀 Iniciando proceso de guardado...');
    console.log('📋 Estado del formulario:', {
      valid: this.clienteForm.valid,
      invalid: this.clienteForm.invalid
    });
    
    // Verificar validación del formulario excluyendo el campo correo si está deshabilitado
    const formValid = this.clienteForm.valid;
    const hasImageChanges = this.hasImageChanges;
    
    // Siempre verificar que los campos requeridos estén completos (excepto correo en edición)
    let formValidForEdit = true;
    const requiredFields = ['nombre', 'apellidoPaterno', 'genero', 'telefono'];
    console.log('🔍 Verificando campos requeridos...');
    
    const camposFaltantes: string[] = [];
    
    for (const fieldName of requiredFields) {
      const field = this.clienteForm.get(fieldName);
      const fieldValue = field?.value;
      const fieldValid = field?.valid;
      const fieldTouched = field?.touched;
      
      console.log(`Campo ${fieldName}:`, {
        valor: fieldValue,
        valido: fieldValid,
        tocado: fieldTouched,
        errores: field?.errors
      });
      
      if (field && field.invalid) {
        formValidForEdit = false;
        console.log(`❌ Campo requerido inválido: ${fieldName}`);
        
        // Agregar nombre amigable del campo faltante
        switch (fieldName) {
          case 'nombre':
            camposFaltantes.push('Nombre');
            break;
          case 'apellidoPaterno':
            camposFaltantes.push('Apellido Paterno');
            break;
          case 'genero':
            camposFaltantes.push('Género');
            break;
          case 'telefono':
            camposFaltantes.push('Teléfono');
            break;
        }
      }
    }
    
    console.log('✅ Formulario válido para guardar:', formValidForEdit);
    console.log('🖼️ Tiene cambios de imagen:', hasImageChanges);

    if (!formValidForEdit) {
      // Mostrar alerta con campos faltantes
      const mensaje = `Por favor complete los siguientes campos obligatorios:\n\n${camposFaltantes.join('\n')}`;
      Swal.fire({
        title: 'Campos requeridos',
        text: mensaje,
        icon: 'warning',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Proceder con el guardado si los campos requeridos están completos
    if (formValidForEdit) {
      // Solo validar email único si NO estamos editando
      const isEditMode = !!this.data?.cliente?.id;
      const email = this.clienteForm.get('correo')?.value;
      
      if (email && !isEditMode) {
        console.log('🔍 Iniciando validación final de email (NUEVO CLIENTE)...');
        console.log('Clientes cargados:', this.todosLosClientes.length);
        
        // Si no hay clientes cargados, cargar de nuevo
        if (this.todosLosClientes.length === 0) {
          console.log('⚠️ No hay clientes cargados, cargando de nuevo...');
          this.cargarClientes();
          // Esperar un poco y volver a intentar
          setTimeout(() => {
            this.guardar();
          }, 1500);
          return;
        }

        const clienteActual = this.data?.cliente;
        
        // Filtrar clientes que no sean el actual
        const otrosClientes = this.todosLosClientes.filter(cliente => {
          return cliente.id !== clienteActual?.id;
        });
        
        const emailExiste = otrosClientes.some(cliente => {
          return cliente.correo && cliente.correo.toLowerCase() === email.toLowerCase();
        });

        console.log('Validación final - Email:', email);
        console.log('Cliente actual:', clienteActual?.id);
        console.log('Otros clientes a comparar:', otrosClientes.length);
        console.log('Email existe:', emailExiste);

        if (emailExiste) {
          Swal.fire('Error', 'Este correo electrónico ya está registrado por otro cliente', 'error');
          return;
        }
      } else if (isEditMode) {
        console.log('✅ Modo edición - No se valida email único');
      }

      try {
        let imageUrl = this.data?.cliente?.imageUrl || this.defaultImageUrl;
        
        console.log('🔄 Procesando imagen...');
        console.log('Imagen actual:', this.data?.cliente?.imageUrl);
        console.log('Archivo seleccionado:', this.selectedFile?.name);
        console.log('Has image changes:', this.hasImageChanges);
        
        // Si hay una nueva imagen seleccionada, subirla
        if (this.selectedFile) {
          console.log('🔄 Subiendo imagen del cliente...');
          imageUrl = await this.uploadImage();
          console.log('✅ Imagen subida exitosamente:', imageUrl);
        } else {
          console.log('ℹ️ No hay nueva imagen, manteniendo la actual:', imageUrl);
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
          correo: this.clienteForm.get('correo')?.value || this.data?.cliente?.correo || '', // Obtener valor aunque esté deshabilitado
          imageUrl: imageUrl,
          imageFileName: this.selectedFile ? this.selectedFile.name : (this.data?.cliente?.imageFileName || ''),
          kilometrosCasa: this.clienteForm.value.kilometrosCasa,
          urlGoogleMaps: this.clienteForm.value.urlGoogleMaps,
          fecha: fechaPrimeraVisita
        };
        
        console.log('📝 Datos del cliente a guardar:', {
          id: clienteData.id,
          nombre: clienteData.nombre,
          correo: clienteData.correo,
          imageUrl: clienteData.imageUrl,
          imageFileName: clienteData.imageFileName
        });
        this.loadingService.show();
        this.dialogRef.close(clienteData);
      } catch (error) {
        console.error('❌ Error al procesar la imagen:', error);
        Swal.fire('Error', this.errorMessages.getUserMessage(error, 'subir imagen'), 'error');
      }
    } else {
      console.log('Formulario inválido:', this.clienteForm.errors);
      Swal.fire('Error', 'Por favor, completa todos los campos requeridos correctamente', 'error');
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.clienteForm.get(fieldName);
    if (!field?.errors) return '';

    const errors = field.errors;
    
    switch (fieldName) {
      case 'nombre':
        if (errors['required']) return 'El nombre es obligatorio';
        if (errors['minlength']) return 'El nombre debe tener al menos 2 caracteres';
        break;
      case 'apellidoPaterno':
        if (errors['required']) return 'El apellido paterno es obligatorio';
        if (errors['minlength']) return 'El apellido paterno debe tener al menos 2 caracteres';
        break;
      case 'apellidoMaterno':
        if (errors['minlength']) return 'El apellido materno debe tener al menos 2 caracteres';
        break;
      case 'genero':
        if (errors['required']) return 'Debe seleccionar un género';
        break;
      case 'telefono':
        if (errors['required']) return 'El teléfono es obligatorio';
        if (errors['pattern']) return 'El teléfono debe tener 10 dígitos';
        if (errors['minlength']) return 'El teléfono debe tener 10 dígitos';
        break;
      case 'correo':
        if (errors['required']) return 'El correo es obligatorio';
        if (errors['email']) return 'Ingrese un correo válido';
        if (errors['emailDuplicado']) return 'Este correo ya está registrado';
        break;
      case 'codigoPostal':
        if (errors['pattern']) return 'El código postal debe tener 5 dígitos';
        break;
      case 'numero':
        if (errors['pattern']) return 'El número debe ser válido';
        break;
      case 'kilometrosCasa':
        if (errors['min']) return 'Los kilómetros no pueden ser negativos';
        break;
      case 'urlGoogleMaps':
        if (errors['pattern']) return 'Ingrese una URL válida de Google Maps';
        break;
    }
    
    return 'Campo inválido';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.clienteForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  isFormValidForSave(): boolean {
    // Verificar campos requeridos
    const requiredFields = ['nombre', 'apellidoPaterno', 'genero', 'telefono'];
    let isValid = true;
    
    for (const fieldName of requiredFields) {
      const field = this.clienteForm.get(fieldName);
      if (field && field.invalid) {
        // Marcar el campo como tocado para mostrar el error visual
        field.markAsTouched();
        isValid = false;
      }
    }
    
    // Si hay cambios de imagen, permitir guardar aunque el formulario no sea válido
    if (this.hasImageChanges && isValid) {
      return true;
    }
    
    // Para nuevos clientes, verificar que el correo sea válido
    const isEditMode = !!this.data?.cliente?.id;
    if (!isEditMode) {
      const emailField = this.clienteForm.get('correo');
      if (emailField && emailField.invalid) {
        emailField.markAsTouched();
        isValid = false;
      }
    }
    
    return isValid;
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
      this.hasImageChanges = true; // Marcar que la imagen ha cambiado
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        // Marcar el formulario como modificado para habilitar el botón guardar
        this.clienteForm.markAsDirty();
        this.clienteForm.markAsTouched();
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
              // Eliminar imagen anterior si existe
              this.eliminarImagenAnterior();
              
              // Actualizar el preview con la nueva URL
              this.imagePreview = url;
              console.log('✅ Preview actualizado con nueva URL:', url);
              
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

  eliminarImagenAnterior() {
    // Solo eliminar si hay una imagen anterior y no es la imagen por defecto
    if (this.data?.cliente?.imageUrl && 
        this.data.cliente.imageUrl !== this.defaultImageUrl &&
        this.data.cliente.imageFileName) {
      
      console.log('🗑️ Eliminando imagen anterior:', this.data.cliente.imageFileName);
      
      const imageRef = this.storage.ref(`Clientes/${this.data.cliente.imageFileName}`);
      imageRef.delete().subscribe({
        next: () => {
          console.log('✅ Imagen anterior eliminada del storage');
        },
        error: (error) => {
          console.warn('⚠️ No se pudo eliminar la imagen anterior:', error);
          // No fallar el proceso si no se puede eliminar la imagen anterior
        }
      });
    }
  }

  removeImage() {
    // Eliminar imagen del storage si existe
    if (this.data?.cliente?.imageUrl && 
        this.data.cliente.imageUrl !== this.defaultImageUrl &&
        this.data.cliente.imageFileName) {
      
      console.log('🗑️ Eliminando imagen del storage:', this.data.cliente.imageFileName);
      
      const imageRef = this.storage.ref(`Clientes/${this.data.cliente.imageFileName}`);
      imageRef.delete().subscribe({
        next: () => {
          console.log('✅ Imagen eliminada del storage');
        },
        error: (error) => {
          console.warn('⚠️ No se pudo eliminar la imagen del storage:', error);
        }
      });
    }
    
    this.selectedFile = null;
    this.imagePreview = null;
    this.uploadProgress = 0;
    this.hasImageChanges = false; // Resetear el indicador de cambios de imagen
    
    // Marcar el formulario como modificado para habilitar el botón guardar
    this.clienteForm.markAsDirty();
    this.clienteForm.markAsTouched();
  }

  cerrar() {
    this.dialogRef.close();
  }

  cargarClientes() {
    console.log('🔄 Cargando clientes para validación...');
    this.clientesService.getClientes().subscribe({
      next: (clientes) => {
        this.todosLosClientes = clientes || [];
        console.log('✅ Clientees cargados para validación:', this.todosLosClientes.length);
        console.log('Cliente actual en edición:', this.data?.cliente);
        
        // Log de todos los clientes para depuración
        this.todosLosClientes.forEach((cliente, index) => {
          console.log(`Cliente ${index}:`, {
            id: cliente.id,
            nombre: cliente.nombre,
            email: cliente.correo,
            activo: cliente.activo
          });
        });

        // Forzar revalidación del campo email después de cargar clientes
        const emailControl = this.clienteForm.get('correo');
        if (emailControl && emailControl.value) {
          console.log('🔄 Forzando revalidación del email después de cargar clientes...');
          emailControl.updateValueAndValidity();
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar clientes:', error);
        this.todosLosClientes = [];
      }
    });
  }

  cargarPacientesRelacionados() {
    if (!this.data?.cliente?.id) {
      console.log('❌ No hay ID de cliente para cargar pacientes');
      return;
    }

    this.cargandoPacientes = true;
    console.log('🔄 Cargando pacientes relacionados para cliente:', this.data.cliente.id);

    this.pacientesService.getPacientes().subscribe({
      next: (pacientes) => {
        const pacientesData = pacientes || [];
        this.pacientesRelacionados = pacientesData.filter(paciente => 
          paciente.idCliente === this.data.cliente.id
        );
        
        console.log('✅ Pacientes relacionados cargados:', this.pacientesRelacionados.length);
        this.pacientesRelacionados.forEach((paciente, index) => {
          console.log(`Paciente ${index}:`, {
            id: paciente.id,
            nombre: paciente.nombre,
            especie: paciente.especie,
            raza: paciente.raza,
            estado: paciente.estado
          });
        });
        
        this.cargandoPacientes = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar pacientes relacionados:', error);
        this.pacientesRelacionados = [];
        this.cargandoPacientes = false;
      }
    });
  }

  calcularEdad(fechaNacimiento: string): string {
    if (!fechaNacimiento) return 'N/P';
    
    try {
      const fecha = new Date(fechaNacimiento);
      
      // Validar que la fecha sea válida
      if (isNaN(fecha.getTime())) {
        return 'N/P';
      }
      
      const hoy = new Date();
      const diferencia = hoy.getTime() - fecha.getTime();
      const edadEnMilisegundos = diferencia / (1000 * 60 * 60 * 24 * 365.25);
      const años = Math.floor(edadEnMilisegundos);
      const meses = Math.floor((edadEnMilisegundos - años) * 12);
      
      // Validar que los cálculos sean válidos
      if (isNaN(años) || isNaN(meses) || años < 0 || meses < 0) {
        return 'N/P';
      }
      
      if (años === 0) {
        return `${meses} mes${meses !== 1 ? 'es' : ''}`;
      } else if (meses === 0) {
        return `${años} año${años !== 1 ? 's' : ''}`;
      } else {
        return `${años} año${años !== 1 ? 's' : ''} y ${meses} mes${meses !== 1 ? 'es' : ''}`;
      }
    } catch (error) {
      console.error('Error al calcular edad:', error);
      return 'N/P';
    }
  }
}