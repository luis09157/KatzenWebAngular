import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Producto } from '../../shared/inventario.models';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

@Component({
  selector: 'app-salida-dialog',
  templateUrl: './salida-dialog.component.html',
  styleUrls: ['./salida-dialog.component.css']
})
export class SalidaDialogComponent implements OnInit {
  salidaForm: FormGroup;
  loading = false;
  
  productos: Producto[] = [];
  productosFiltrados: Observable<Producto[]>;
  productoSeleccionado: Producto | null = null;

  motivosSalida = [
    { valor: 'uso_consulta', etiqueta: 'Uso en Consulta' },
    { valor: 'venta_directa', etiqueta: 'Venta Directa' },
    { valor: 'muestra_medica', etiqueta: 'Muestra Médica' },
    { valor: 'merma', etiqueta: 'Merma / Caducado' },
    { valor: 'robo_perdida', etiqueta: 'Robo / Pérdida' },
    { valor: 'otro', etiqueta: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<SalidaDialogComponent>,
    private errorMessages: ErrorMessagesService
  ) {
    this.salidaForm = this.fb.group({
      producto_busqueda: ['', Validators.required],
      producto_id: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      motivo: ['uso_consulta', Validators.required],
      observaciones: ['']
    });

    this.productosFiltrados = this.salidaForm.get('producto_busqueda')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarProductos(value || ''))
    );
  }

  ngOnInit(): void {
    console.log('🚀 Salida Dialog cargado');
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.inventarioService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        console.log('✅ Productos cargados:', productos.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar productos:', error);
      }
    });
  }

  private _filtrarProductos(valor: string): Producto[] {
    if (typeof valor !== 'string') return this.productos;
    
    const filtro = valor.toLowerCase();
    return this.productos.filter(p => 
      p.nombre.toLowerCase().includes(filtro) ||
      p.codigo_barras.toLowerCase().includes(filtro) ||
      p.marca.toLowerCase().includes(filtro)
    );
  }

  displayProducto(producto: Producto | null): string {
    return producto ? `${producto.nombre} - ${producto.presentacion}` : '';
  }

  onProductoSeleccionado(producto: Producto): void {
    console.log('🔍 Producto seleccionado:', producto.nombre);
    this.productoSeleccionado = producto;
    this.salidaForm.patchValue({
      producto_id: producto.id
    });

    // Validar si hay stock disponible
    if (producto.stock_actual <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Sin Stock',
        text: `El producto "${producto.nombre}" no tiene stock disponible`,
        confirmButtonColor: '#f44336'
      });
    }
  }

  getStockDisponible(): number {
    return this.productoSeleccionado?.stock_actual || 0;
  }

  isStockInsuficiente(): boolean {
    const cantidad = this.salidaForm.get('cantidad')?.value || 0;
    return cantidad > this.getStockDisponible();
  }

  getColorMotivo(): string {
    const motivo = this.salidaForm.get('motivo')?.value;
    const colores: {[key: string]: string} = {
      'uso_consulta': '#2196f3',
      'venta_directa': '#4caf50',
      'muestra_medica': '#ff9800',
      'merma': '#f44336',
      'robo_perdida': '#9c27b0',
      'otro': '#757575'
    };
    return colores[motivo] || '#757575';
  }

  getIconoMotivo(): string {
    const motivo = this.salidaForm.get('motivo')?.value;
    const iconos: {[key: string]: string} = {
      'uso_consulta': 'medical_services',
      'venta_directa': 'shopping_cart',
      'muestra_medica': 'card_giftcard',
      'merma': 'delete',
      'robo_perdida': 'warning',
      'otro': 'info'
    };
    return iconos[motivo] || 'info';
  }

  getTextoMotivo(): string {
    const motivo = this.salidaForm.get('motivo')?.value;
    const motivoObj = this.motivosSalida.find(m => m.valor === motivo);
    return motivoObj?.etiqueta || '';
  }

  async guardar(): Promise<void> {
    if (this.salidaForm.invalid || !this.productoSeleccionado) {
      this.salidaForm.markAllAsTouched();
      Swal.fire('Formulario Incompleto', 'Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    // Validar stock disponible
    if (this.isStockInsuficiente()) {
      Swal.fire({
        icon: 'error',
        title: 'Stock Insuficiente',
        html: `
          Stock disponible: ${this.getStockDisponible()} ${this.productoSeleccionado.unidad_medida}<br>
          Cantidad solicitada: ${this.salidaForm.get('cantidad')?.value}
        `,
        confirmButtonColor: '#f44336'
      });
      return;
    }

    this.loading = true;

    try {
      const formData = this.salidaForm.value;
      const motivoTexto = this.motivosSalida.find(m => m.valor === formData.motivo)?.etiqueta || formData.motivo;
      
      console.log('🔄 Registrando salida de producto...');
      console.log('Datos:', formData);

      await this.inventarioService.registrarSalida(
        formData.producto_id,
        formData.cantidad,
        `${motivoTexto}. ${formData.observaciones || ''}`.trim(),
        undefined, // paciente_id
        undefined, // historial_id
        undefined, // venta_id
        formData.observaciones
      );

      console.log('✅ Salida registrada exitosamente');

      const nuevoStock = this.productoSeleccionado.stock_actual - formData.cantidad;

      Swal.fire({
        icon: 'success',
        title: 'Salida Registrada',
        html: `
          <strong>${this.productoSeleccionado.nombre}</strong><br>
          Cantidad: ${formData.cantidad} ${this.productoSeleccionado.unidad_medida}<br>
          Stock restante: ${nuevoStock} ${this.productoSeleccionado.unidad_medida}
          ${nuevoStock <= this.productoSeleccionado.stock_minimo ? '<br><span style="color:#f44336;">⚠️ Stock bajo el mínimo</span>' : ''}
        `,
        timer: 3000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Error al registrar salida:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'registrar salida'), 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  hasError(campo: string, error: string): boolean {
    const control = this.salidaForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}

