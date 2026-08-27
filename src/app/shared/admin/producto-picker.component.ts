import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation
} from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, Observable, Subject, combineLatest } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { Producto } from '../inventario.models';
import { InventarioService } from '../../inventario/inventario.service';
import { LoggerService } from '../../core/logger.service';
import {
  filtrarProductos,
  getProductoDisplayLabel,
  productoSinStock,
  productoStockBajo
} from '../../core/utils/producto-search.util';
import {
  DEFAULT_PRODUCTO_PICKER_FIELDS,
  ProductoPickerFields,
  ProductoSelection
} from './producto-picker.models';

@Component({
  selector: 'app-producto-picker',
  templateUrl: './producto-picker.component.html',
  styleUrls: ['./producto-picker.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProductoPickerComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  @Input({ required: true }) formGroup!: FormGroup;
  @Input() fields: ProductoPickerFields = DEFAULT_PRODUCTO_PICKER_FIELDS;
  @Input() disabled = false;
  @Input() required = true;
  @Input() label = 'Buscar producto';
  @Input() placeholder = 'Nombre, código, marca o QR…';
  @Input() compact = false;
  @Input() showStock = true;

  @Output() selectionChange = new EventEmitter<ProductoSelection>();

  readonly productoSearch = new FormControl<string | Producto>('');
  private readonly productos$ = new BehaviorSubject<Producto[]>([]);
  productos: Producto[] = [];
  filteredProductos!: Observable<Producto[]>;
  productoSeleccionado: Producto | null = null;
  cargando = true;

  constructor(
    private inventarioService: InventarioService,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.filteredProductos = combineLatest([
      this.productoSearch.valueChanges.pipe(startWith(this.productoSearch.value)),
      this.productos$
    ]).pipe(map(([value, productos]) => filtrarProductos(productos, value)));

    if (this.disabled) {
      this.productoSearch.disable({ emitEvent: false });
    }

    this.productoSearch.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      if (typeof value === 'string' && this.productoSeleccionado) {
        const label = getProductoDisplayLabel(this.productoSeleccionado);
        if (value.trim() !== label && value.trim() !== this.productoSeleccionado.nombre) {
          this.limpiarSeleccion(true);
        }
      }
    });

    this.formGroup
      .get(this.fieldNames.productoId)
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => this.restaurarSeleccion());

    this.cargarProductos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get fieldNames(): Required<ProductoPickerFields> {
    return {
      productoId: this.fields.productoId || DEFAULT_PRODUCTO_PICKER_FIELDS.productoId,
      productoNombre: this.fields.productoNombre || DEFAULT_PRODUCTO_PICKER_FIELDS.productoNombre
    };
  }

  get productoIdControl() {
    return this.formGroup.get(this.fieldNames.productoId);
  }

  get showRequiredError(): boolean {
    const ctrl = this.productoIdControl;
    return !!(this.required && ctrl && ctrl.hasError('required') && (ctrl.dirty || ctrl.touched));
  }

  displayProducto = (producto: Producto | string | null): string => {
    if (!producto) return '';
    if (typeof producto === 'string') return producto;
    return getProductoDisplayLabel(producto);
  };

  stockBajo = productoStockBajo;
  sinStock = productoSinStock;

  onProductoSelected(producto: Producto): void {
    if (!producto?.id) return;
    this.aplicarProducto(producto, true);
  }

  limpiarProducto(): void {
    if (this.disabled) return;
    this.productoSearch.setValue('', { emitEvent: false });
    this.limpiarSeleccion(true);
  }

  onBlur(): void {
    this.productoIdControl?.markAsTouched();
  }

  private cargarProductos(): void {
    this.inventarioService
      .getProductos()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: productos => {
          this.productos = productos || [];
          this.productos$.next(this.productos);
          this.cargando = false;
          this.restaurarSeleccion();
        },
        error: error => {
          this.logger.error('ProductoPicker: error cargando productos', error);
          this.productos = [];
          this.productos$.next([]);
          this.cargando = false;
        }
      });
  }

  private restaurarSeleccion(): void {
    const id = String(this.formGroup?.get(this.fieldNames.productoId)?.value || '').trim();
    if (!id || !this.productos.length) return;
    const producto = this.productos.find(p => p.id === id);
    if (!producto) return;
    if (this.productoSeleccionado?.id === id) {
      this.productoSeleccionado = producto;
      this.productoSearch.setValue(producto, { emitEvent: false });
      return;
    }
    this.aplicarProducto(producto, true);
  }

  private aplicarProducto(producto: Producto, emit: boolean): void {
    this.productoSeleccionado = producto;
    const { productoId, productoNombre } = this.fieldNames;
    const patch: Record<string, string> = { [productoId]: producto.id || '' };
    if (this.formGroup.get(productoNombre)) {
      patch[productoNombre] = producto.nombre || '';
    }
    this.formGroup.patchValue(patch, { emitEvent: false });
    this.productoSearch.setValue(producto, { emitEvent: false });
    if (emit) {
      this.selectionChange.emit({ producto });
    }
  }

  private limpiarSeleccion(emit: boolean): void {
    this.productoSeleccionado = null;
    const { productoId, productoNombre } = this.fieldNames;
    const patch: Record<string, string> = { [productoId]: '' };
    if (this.formGroup.get(productoNombre)) {
      patch[productoNombre] = '';
    }
    this.formGroup.patchValue(patch);
    if (emit) {
      this.selectionChange.emit({ producto: null });
    }
  }
}
