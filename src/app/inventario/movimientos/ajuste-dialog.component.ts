import { Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { InventarioService } from '../inventario.service';
import { Producto } from '../../shared/inventario.models';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { ErrorMessagesService } from '../../core/error-messages.service';
import { LoggerService } from '../../core/logger.service';

@Component({
  selector: 'app-ajuste-dialog',
  templateUrl: './ajuste-dialog.component.html',
  styleUrls: ['./ajuste-dialog.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class AjusteDialogComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  ajusteForm: FormGroup;
  loading = false;
  productos: Producto[] = [];
  productosFiltrados: Observable<Producto[]>;
  productoSeleccionado: Producto | null = null;

  motivosAjuste = [
    { valor: 'conteo_fisico', etiqueta: 'Conteo Físico' },
    { valor: 'error_registro', etiqueta: 'Error de Registro' },
    { valor: 'merma_no_registrada', etiqueta: 'Merma no Registrada' },
    { valor: 'robo', etiqueta: 'Robo' },
    { valor: 'dano', etiqueta: 'Daño/Deterioro' },
    { valor: 'otro', etiqueta: 'Otro' }
  ];

  constructor(
    private fb: FormBuilder,
    private inventarioService: InventarioService,
    public dialogRef: MatDialogRef<AjusteDialogComponent>,
    private errorMessages: ErrorMessagesService,
    private logger: LoggerService
  ) {
    this.ajusteForm = this.fb.group({
      producto_busqueda: ['', Validators.required],
      producto_id: ['', Validators.required],
      stock_fisico: [0, [Validators.required, Validators.min(0)]],
      motivo: ['conteo_fisico', Validators.required],
      observaciones: ['']
    });

    this.productosFiltrados = this.ajusteForm.get('producto_busqueda')!.valueChanges.pipe(
      startWith(''),
      map(value => this._filtrarProductos(value || ''))
    );
  }

  ngOnInit(): void {
    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarProductos(): void {
    this.inventarioService.getProductos().pipe(takeUntil(this.destroy$)).subscribe({
      next: (productos) => { this.productos = productos; },
      error: (error) => { this.logger.error('Error al cargar productos:', error); }
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
    this.ajusteForm.patchValue({
      producto_id: producto.id,
      stock_fisico: producto.stock_actual // Pre-llenar con stock actual
    });
  }

  getStockSistema(): number {
    return this.productoSeleccionado?.stock_actual || 0;
  }

  getStockFisico(): number {
    return this.ajusteForm.get('stock_fisico')?.value || 0;
  }

  getDiferencia(): number {
    return this.getStockFisico() - this.getStockSistema();
  }

  getTipoDiferencia(): 'positiva' | 'negativa' | 'sin_cambio' {
    const diferencia = this.getDiferencia();
    if (diferencia > 0) return 'positiva';
    if (diferencia < 0) return 'negativa';
    return 'sin_cambio';
  }

  getColorDiferencia(): string {
    const tipo = this.getTipoDiferencia();
    return tipo === 'positiva' ? '#4caf50' : tipo === 'negativa' ? '#f44336' : '#757575';
  }

  getIconoDiferencia(): string {
    const tipo = this.getTipoDiferencia();
    return tipo === 'positiva' ? 'arrow_upward' : tipo === 'negativa' ? 'arrow_downward' : 'remove';
  }

  async guardar(): Promise<void> {
    if (this.ajusteForm.invalid || !this.productoSeleccionado) {
      this.ajusteForm.markAllAsTouched();
      Swal.fire('Formulario Incompleto', 'Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    const diferencia = this.getDiferencia();

    // Si no hay diferencia, advertir
    if (diferencia === 0) {
      const result = await Swal.fire({
        title: 'Sin Cambios',
        text: 'El stock físico es igual al stock en sistema. ¿Deseas continuar?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar'
      });

      if (!result.isConfirmed) return;
    }

    // Confirmar ajuste si hay diferencia significativa
    if (Math.abs(diferencia) > 10) {
      const result = await Swal.fire({
        title: 'Diferencia Grande',
        html: `
          <strong>Diferencia detectada: ${diferencia > 0 ? '+' : ''}${diferencia} unidades</strong><br><br>
          ¿Estás seguro de aplicar este ajuste?
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, ajustar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f44336'
      });

      if (!result.isConfirmed) return;
    }

    this.loading = true;

    try {
      const formData = this.ajusteForm.value;
      const motivoTexto = this.motivosAjuste.find(m => m.valor === formData.motivo)?.etiqueta || formData.motivo;
      
      console.log('🔄 Registrando ajuste de inventario...');
      console.log('Stock sistema:', this.getStockSistema());
      console.log('Stock físico:', this.getStockFisico());
      console.log('Diferencia:', diferencia);

      await this.inventarioService.registrarAjuste(
        formData.producto_id,
        formData.stock_fisico,
        `${motivoTexto}. Diferencia: ${diferencia > 0 ? '+' : ''}${diferencia}. ${formData.observaciones || ''}`.trim(),
        formData.observaciones
      );

      console.log('✅ Ajuste registrado exitosamente');

      Swal.fire({
        icon: 'success',
        title: 'Ajuste Registrado',
        html: `
          <strong>${this.productoSeleccionado.nombre}</strong><br>
          Stock anterior: ${this.getStockSistema()} ${this.productoSeleccionado.unidad_medida}<br>
          Stock nuevo: ${this.getStockFisico()} ${this.productoSeleccionado.unidad_medida}<br>
          <span style="color:${this.getColorDiferencia()}; font-weight:bold;">
            Diferencia: ${diferencia > 0 ? '+' : ''}${diferencia}
          </span>
        `,
        timer: 3000,
        showConfirmButton: false
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('❌ Error al registrar ajuste:', error);
      Swal.fire('Error', this.errorMessages.getUserMessage(error, 'registrar ajuste'), 'error');
    } finally {
      this.loading = false;
    }
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }

  hasError(campo: string, error: string): boolean {
    const control = this.ajusteForm.get(campo);
    return !!(control && control.hasError(error) && (control.dirty || control.touched));
  }
}

