import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { OrdenCompra, Producto } from '../../shared/inventario.models';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';

@Component({
  selector: 'app-recibir-orden-dialog',
  templateUrl: './recibir-orden-dialog.component.html',
  styleUrls: ['./recibir-orden-dialog.component.css']
})
export class RecibirOrdenDialogComponent implements OnInit {
  recibirForm: FormGroup;
  loading = false;
  orden: OrdenCompra;
  productos: Map<string, Producto> = new Map();

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<RecibirOrdenDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { orden: OrdenCompra },
    private errorMessages: ErrorMessagesService
  ) {
    this.orden = data.orden;
    
    this.recibirForm = this.fb.group({
      fecha_recepcion: [new Date()],
      productos: this.fb.array([]),
      observaciones: ['']
    });
  }

  ngOnInit(): void {
    console.log('📦 Recibir Orden:', this.orden.folio);
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.inventarioService.getProductos().subscribe({
      next: (productos) => {
        productos.forEach(p => {
          if (p.id) this.productos.set(p.id, p);
        });

        // Inicializar FormArray con productos de la orden
        this.orden.items.forEach(p => {
          const productoGroup = this.fb.group({
            producto_id: [p.producto_id],
            cantidad_solicitada: [p.cantidad_solicitada],
            cantidad_recibida: [p.cantidad_recibida || 0],
            cantidad_a_recibir: [p.cantidad_solicitada - (p.cantidad_recibida || 0)]
          });

          this.productosArray.push(productoGroup);
        });

        console.log('✅ Productos cargados para recepción');
      },
      error: (error) => console.error('❌ Error al cargar productos:', error)
    });
  }

  get productosArray(): FormArray {
    return this.recibirForm.get('productos') as FormArray;
  }

  getProductoNombre(productoId: string): string {
    return this.productos.get(productoId)?.nombre || 'Desconocido';
  }

  getProductoPresentacion(productoId: string): string {
    return this.productos.get(productoId)?.presentacion || '';
  }

  getProductoUnidad(productoId: string): string {
    return this.productos.get(productoId)?.unidad_medida || '';
  }

  recibirTodo(): void {
    this.productosArray.controls.forEach(control => {
      const pendiente = control.get('cantidad_solicitada')?.value - 
                       control.get('cantidad_recibida')?.value;
      control.patchValue({ cantidad_a_recibir: pendiente });
    });
  }

  async guardar(): Promise<void> {
    const productosARecibir = this.recibirForm.value.productos.filter(
      (p: any) => p.cantidad_a_recibir > 0
    );

    if (productosARecibir.length === 0) {
      Swal.fire('Sin Productos', 'Debes recibir al menos un producto', 'warning');
      return;
    }

    this.loading = true;

    try {
      if (!this.orden.id) throw new Error('ID de orden no válido');

      console.log('🔄 Recibiendo orden...');
      await this.inventarioService.recibirOrdenCompra(
        this.orden.id,
        productosARecibir,
        this.recibirForm.value.observaciones
      );
      console.log('✅ Orden recibida');

      Swal.fire({
        icon: 'success',
        title: 'Orden Recibida',
        text: `Se han recibido ${productosARecibir.length} productos`,
        timer: 2000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Error al recibir orden:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'recibir orden'), 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

