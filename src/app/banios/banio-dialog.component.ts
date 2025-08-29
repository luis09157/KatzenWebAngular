import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BaniosService } from './banios.service';
import { UsuariosService } from '../usuarios/usuarios.service';
import { Banio } from '../shared/banio.model';
import Swal from 'sweetalert2/dist/sweetalert2.js';

@Component({
  selector: 'app-banio-dialog',
  templateUrl: './banio-dialog.component.html',
  styleUrls: ['./banio-dialog.component.css']
})
export class BanioDialogComponent implements OnInit {
  banioForm: FormGroup;
  usuarios: any[] = [];
  loading = false;
  esEdicion = false;
  
  // Opciones para los selects
  tiposServicios = [
    { value: 'baño_básico', label: 'Baño Básico', icon: 'shower' },
    { value: 'baño_completo', label: 'Baño Completo', icon: 'spa' },
    { value: 'corte_pelo', label: 'Corte de Pelo', icon: 'content_cut' },
    { value: 'corte_uñas', label: 'Corte de Uñas', icon: 'scissors' },
    { value: 'deslanado', label: 'Deslanado', icon: 'brush' },
    { value: 'tratamiento_especial', label: 'Tratamiento Especial', icon: 'healing' }
  ];

  estados = [
    { value: 'programado', label: 'Programado', color: '#2196f3' },
    { value: 'en_proceso', label: 'En Proceso', color: '#ff9800' },
    { value: 'completado', label: 'Completado', color: '#4caf50' },
    { value: 'cancelado', label: 'Cancelado', color: '#f44336' }
  ];

  prioridades = [
    { value: 'baja', label: 'Baja', color: '#4caf50' },
    { value: 'media', label: 'Media', color: '#ff9800' },
    { value: 'alta', label: 'Alta', color: '#f44336' },
    { value: 'urgente', label: 'Urgente', color: '#9c27b0' }
  ];

  comportamientos = [
    { value: 'tranquilo', label: 'Tranquilo' },
    { value: 'nervioso', label: 'Nervioso' },
    { value: 'agresivo', label: 'Agresivo' },
    { value: 'cooperativo', label: 'Cooperativo' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<BanioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private baniosService: BaniosService,
    private usuariosService: UsuariosService
  ) {
    this.banioForm = this.fb.group({
      paciente_id: ['', Validators.required],
      paciente: ['', Validators.required],
      cliente_id: ['', Validators.required],
      cliente: ['', Validators.required],
      fecha_banio: ['', Validators.required],
      hora_banio: ['', Validators.required],
      tipo_servicio: ['', Validators.required],
      estado: ['programado', Validators.required],
      prioridad: ['media', Validators.required],
      observaciones: [''],
      productos_utilizados: [[]],
      alergias_conocidas: [[]],
      comportamiento: ['tranquilo'],
      peluquero_id: ['', Validators.required],
      precio_base: [0, [Validators.required, Validators.min(0)]],
      servicios_adicionales: [[]],
      precio_total: [0, [Validators.required, Validators.min(0)]],
      pagado: [false],
      metodo_pago: [''],
      duracion_estimada: [60, [Validators.required, Validators.min(15)]],
      tiempo_inicio: [''],
      tiempo_fin: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.cargarUsuarios();
    
    if (this.data && this.data.id) {
      this.esEdicion = true;
      this.cargarDatosBanio();
    } else if (this.data) {
      // Datos del cliente y paciente seleccionados
      this.banioForm.patchValue({
        paciente_id: this.data.paciente_id,
        paciente: this.data.paciente,
        cliente_id: this.data.cliente_id,
        cliente: this.data.cliente
      });
    }
    
    this.configurarCalculoPrecio();
  }

  cargarUsuarios() {
    this.usuariosService.getUsuarios().subscribe(usuarios => {
      this.usuarios = (usuarios || []).filter(u => u.activo !== false);
    });
  }

  cargarDatosBanio() {
    if (this.data.id) {
      this.baniosService.getBanioById(this.data.id).subscribe(banio => {
        if (banio) {
          this.banioForm.patchValue(banio);
        }
      });
    }
  }

  configurarCalculoPrecio() {
    // Escuchar cambios en precio base y servicios adicionales para calcular precio total
    this.banioForm.get('precio_base')?.valueChanges.subscribe(() => {
      this.calcularPrecioTotal();
    });

    this.banioForm.get('servicios_adicionales')?.valueChanges.subscribe(() => {
      this.calcularPrecioTotal();
    });
  }

  calcularPrecioTotal() {
    const precioBase = this.banioForm.get('precio_base')?.value || 0;
    const serviciosAdicionales = this.banioForm.get('servicios_adicionales')?.value || [];
    
    const totalAdicionales = serviciosAdicionales.reduce((sum: number, servicio: any) => {
      return sum + (servicio.precio || 0);
    }, 0);
    
    const precioTotal = precioBase + totalAdicionales;
    this.banioForm.patchValue({ precio_total: precioTotal });
  }

  agregarServicioAdicional() {
    const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
    const nuevoServicio = {
      servicio: '',
      precio: 0
    };
    
    this.banioForm.patchValue({
      servicios_adicionales: [...serviciosActuales, nuevoServicio]
    });
  }

  removerServicioAdicional(index: number) {
    const serviciosActuales = this.banioForm.get('servicios_adicionales')?.value || [];
    serviciosActuales.splice(index, 1);
    this.banioForm.patchValue({ servicios_adicionales: serviciosActuales });
    this.calcularPrecioTotal();
  }

  agregarAlergia() {
    const alergiasActuales = this.banioForm.get('alergias_conocidas')?.value || [];
    const nuevaAlergia = '';
    
    this.banioForm.patchValue({
      alergias_conocidas: [...alergiasActuales, nuevaAlergia]
    });
  }

  removerAlergia(index: number) {
    const alergiasActuales = this.banioForm.get('alergias_conocidas')?.value || [];
    alergiasActuales.splice(index, 1);
    this.banioForm.patchValue({ alergias_conocidas: alergiasActuales });
  }

  agregarProducto() {
    const productosActuales = this.banioForm.get('productos_utilizados')?.value || [];
    const nuevoProducto = '';
    
    this.banioForm.patchValue({
      productos_utilizados: [...productosActuales, nuevoProducto]
    });
  }

  removerProducto(index: number) {
    const productosActuales = this.banioForm.get('productos_utilizados')?.value || [];
    productosActuales.splice(index, 1);
    this.banioForm.patchValue({ productos_utilizados: productosActuales });
  }

  onSubmit() {
    if (this.banioForm.valid) {
      this.loading = true;
      
      const banioData = this.banioForm.value;
      
      if (this.esEdicion) {
        // Actualizar baño existente
        this.baniosService.actualizarBanio(this.data.id, banioData)
          .then(() => {
            Swal.fire('Actualizado', 'El baño ha sido actualizado exitosamente', 'success');
            this.dialogRef.close(true);
          })
          .catch(error => {
            console.error('Error al actualizar baño:', error);
            Swal.fire('Error', 'No se pudo actualizar el baño', 'error');
            this.loading = false;
          });
      } else {
        // Crear nuevo baño
        this.baniosService.crearBanio(banioData)
          .then(() => {
            Swal.fire('Creado', 'El baño ha sido creado exitosamente', 'success');
            this.dialogRef.close(true);
          })
          .catch(error => {
            console.error('Error al crear baño:', error);
            Swal.fire('Error', 'No se pudo crear el baño', 'error');
            this.loading = false;
          });
      }
    } else {
      Swal.fire('Error', 'Por favor completa todos los campos requeridos', 'error');
    }
  }

  cancelar() {
    this.dialogRef.close();
  }

  getTipoServicioIcon(tipo: string): string {
    const tipoEncontrado = this.tiposServicios.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.icon : 'pets';
  }

  getTipoServicioLabel(tipo: string): string {
    const tipoEncontrado = this.tiposServicios.find(t => t.value === tipo);
    return tipoEncontrado ? tipoEncontrado.label : tipo;
  }
}
