import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError, firstValueFrom } from 'rxjs';
import { 
  Producto, 
  ProductoFormData,
  Movimiento,
  Proveedor,
  ProveedorFormData,
  OrdenCompra,
  Alerta,
  EstadisticasInventario,
  TipoMovimiento
} from '../shared/inventario.models';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private readonly productosPath = 'Katzen/Inventario/Productos';
  private readonly movimientosPath = 'Katzen/Inventario/Movimientos';
  private readonly proveedoresPath = 'Katzen/Inventario/Proveedores';
  private readonly alertasPath = 'Katzen/Inventario/Alertas';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService
  ) {
    console.log('✅ InventarioService inicializado');
  }

  // ==================== PRODUCTOS ====================

  getProductos(): Observable<Producto[]> {
    console.log('🔄 Obteniendo productos...');
    return this.db.list<Producto>(this.productosPath)
      .snapshotChanges()
      .pipe(
        map(changes => {
          const productos = changes
            .map(c => ({ id: c.payload.key, ...c.payload.val() }))
            .filter(p => p.activo !== false)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));
          
          console.log(`✅ ${productos.length} productos obtenidos`);
          return productos;
        }),
        catchError(error => {
          console.error('❌ Error al obtener productos:', error);
          return throwError(() => error);
        })
      );
  }

  getProductosPorCategoria(categoria: string): Observable<Producto[]> {
    return this.getProductos().pipe(
      map(productos => productos.filter(p => p.categoria === categoria))
    );
  }

  getProductosBajoStock(): Observable<Producto[]> {
    return this.getProductos().pipe(
      map(productos => productos.filter(p => p.stock_actual <= p.stock_minimo))
    );
  }

  getProductosPorCaducar(dias: number = 30): Observable<Producto[]> {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + dias);

    return this.getProductos().pipe(
      map(productos => productos.filter(p => {
        if (!p.fecha_caducidad) return false;
        const fechaCad = new Date(p.fecha_caducidad);
        return fechaCad <= fechaLimite && fechaCad >= hoy;
      }))
    );
  }

  getProductoById(id: string): Observable<Producto | null> {
    return this.db.object<Producto>(`${this.productosPath}/${id}`)
      .valueChanges()
      .pipe(
        map(producto => producto ? { id, ...producto } : null)
      );
  }

  async crearProducto(productoData: ProductoFormData): Promise<string> {
    try {
      console.log('🔄 Creando producto:', productoData.nombre);

      // Validar código de barras único
      const productos = await firstValueFrom(this.getProductos());
      const duplicado = productos.find(p => p.codigo_barras === productoData.codigo_barras);
      
      if (duplicado) {
        throw new Error('Ya existe un producto con este código de barras');
      }

      // Calcular margen de ganancia
      const margen = productoData.precio_compra > 0 
        ? ((productoData.precio_venta - productoData.precio_compra) / productoData.precio_compra) * 100
        : 0;

      const timestamp = new Date().toISOString();

      const producto: Producto = {
        ...productoData,
        stock_actual: 0,
        margen_ganancia: parseFloat(margen.toFixed(2)),
        proveedores_alternos: [],
        activo: true,
        created_at: timestamp,
        updated_at: timestamp
      };

      const ref = await this.db.list<Producto>(this.productosPath).push(producto);
      await stampRtdbIdAfterPush(this.db, this.productosPath, ref.key);
      console.log('✅ Producto creado exitosamente con ID:', ref.key);
      return ref.key!;
    } catch (error) {
      console.error('❌ Error al crear producto:', error);
      throw error;
    }
  }

  async actualizarProducto(id: string, cambios: Partial<Producto>): Promise<void> {
    try {
      console.log('🔄 Actualizando producto:', id);

      // Recalcular margen si cambian precios
      if (cambios.precio_compra !== undefined || cambios.precio_venta !== undefined) {
        const productoActual = await firstValueFrom(this.getProductoById(id));
        if (productoActual) {
          const precioCompra = cambios.precio_compra ?? productoActual.precio_compra;
          const precioVenta = cambios.precio_venta ?? productoActual.precio_venta;
          
          if (precioCompra > 0) {
            cambios.margen_ganancia = parseFloat((((precioVenta - precioCompra) / precioCompra) * 100).toFixed(2));
          }
        }
      }

      cambios.updated_at = new Date().toISOString();
      await this.db.object<Producto>(`${this.productosPath}/${id}`).update(cambios);
      console.log('✅ Producto actualizado exitosamente');
    } catch (error) {
      console.error('❌ Error al actualizar producto:', error);
      throw error;
    }
  }

  async eliminarProducto(id: string): Promise<void> {
    return this.actualizarProducto(id, { activo: false });
  }

  buscarProductos(texto: string): Observable<Producto[]> {
    const textoLower = texto.toLowerCase();
    return this.getProductos().pipe(
      map(productos => productos.filter(p =>
        p.nombre.toLowerCase().includes(textoLower) ||
        p.codigo_barras.toLowerCase().includes(textoLower) ||
        p.descripcion.toLowerCase().includes(textoLower) ||
        p.marca.toLowerCase().includes(textoLower)
      ))
    );
  }

  // ==================== MOVIMIENTOS ====================

  async registrarEntrada(
    productoId: string,
    cantidad: number,
    costoUnitario: number,
    motivo: string = 'Entrada por compra',
    ordenCompraId?: string,
    observaciones?: string
  ): Promise<void> {
    console.log('🔄 Registrando entrada de producto...');
    const usuarioId = await this.currentStaff.getStaffId();
    return this.registrarMovimiento({
      tipo: 'entrada',
      producto_id: productoId,
      cantidad: cantidad,
      costo_unitario: costoUnitario,
      costo_total: cantidad * costoUnitario,
      motivo: motivo,
      orden_compra_id: ordenCompraId,
      observaciones: observaciones || '',
      usuario_responsable_id: usuarioId,
      cantidad_anterior: 0,
      cantidad_nueva: 0,
      created_at: new Date().toISOString()
    });
  }

  async registrarSalida(
    productoId: string,
    cantidad: number,
    motivo: string,
    pacienteId?: string,
    historialId?: string,
    ventaId?: string,
    observaciones?: string
  ): Promise<void> {
    console.log('🔄 Registrando salida de producto...');
    const usuarioId = await this.currentStaff.getStaffId();
    return this.registrarMovimiento({
      tipo: 'salida',
      producto_id: productoId,
      cantidad: cantidad,
      costo_unitario: 0,
      costo_total: 0,
      motivo: motivo,
      paciente_id: pacienteId,
      historial_clinico_id: historialId,
      venta_id: ventaId,
      usuario_responsable_id: usuarioId,
      observaciones: observaciones || '',
      cantidad_anterior: 0,
      cantidad_nueva: 0,
      created_at: new Date().toISOString()
    });
  }

  async registrarAjuste(
    productoId: string,
    nuevoStock: number,
    motivo: string,
    observaciones?: string
  ): Promise<void> {
    console.log('🔄 Registrando ajuste de inventario...');
    const usuarioId = await this.currentStaff.getStaffId();
    return this.registrarMovimiento({
      tipo: 'ajuste',
      producto_id: productoId,
      cantidad: nuevoStock,
      costo_unitario: 0,
      costo_total: 0,
      motivo: motivo,
      usuario_responsable_id: usuarioId,
      observaciones: observaciones || '',
      cantidad_anterior: 0,
      cantidad_nueva: 0,
      created_at: new Date().toISOString()
    });
  }

  private async registrarMovimiento(movimiento: Movimiento): Promise<void> {
    try {
      console.log('🔄 Registrando movimiento:', movimiento.tipo);

      const productoPath = `${this.productosPath}/${movimiento.producto_id}`;
      let stockError: string | null = null;

      const txResult = await this.db.database.ref(productoPath).transaction((producto) => {
        if (!producto) {
          stockError = 'Producto no encontrado';
          return undefined;
        }

        const cantidadAnterior = producto.stock_actual ?? 0;
        let nuevoStock = cantidadAnterior;

        switch (movimiento.tipo) {
          case 'entrada':
            nuevoStock += movimiento.cantidad;
            break;
          case 'salida':
            if (cantidadAnterior < movimiento.cantidad) {
              stockError = `Stock insuficiente. Disponible: ${cantidadAnterior}, Solicitado: ${movimiento.cantidad}`;
              return undefined;
            }
            nuevoStock -= movimiento.cantidad;
            break;
          case 'ajuste':
            nuevoStock = movimiento.cantidad;
            break;
          case 'merma':
            nuevoStock -= movimiento.cantidad;
            break;
        }

        movimiento.cantidad_anterior = cantidadAnterior;
        movimiento.cantidad_nueva = nuevoStock;
        return { ...producto, stock_actual: nuevoStock };
      });

      if (stockError) {
        throw new Error(stockError);
      }
      if (!txResult.committed) {
        throw new Error('No se pudo actualizar el stock del producto');
      }

      const ref = await this.db.list(this.movimientosPath).push(movimiento);
      await stampRtdbIdAfterPush(this.db, this.movimientosPath, ref.key);
      console.log('✅ Movimiento registrado en Firebase');
      await this.verificarYCrearAlertas(movimiento.producto_id);
      console.log('✅ Movimiento completado exitosamente');
    } catch (error) {
      console.error('❌ Error al registrar movimiento:', error);
      throw error;
    }
  }

  getMovimientosPorProducto(productoId: string): Observable<Movimiento[]> {
    return this.db.list<Movimiento>(this.movimientosPath)
      .snapshotChanges()
      .pipe(
        map(changes => changes
          .map(c => ({ id: c.payload.key, ...c.payload.val() }))
          .filter(m => m.producto_id === productoId)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        )
      );
  }

  getTodosLosMovimientos(): Observable<Movimiento[]> {
    return this.db.list<Movimiento>(this.movimientosPath)
      .snapshotChanges()
      .pipe(
        map(changes => changes
          .map(c => ({ id: c.payload.key, ...c.payload.val() }))
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        )
      );
  }

  // ==================== PROVEEDORES ====================

  getProveedores(): Observable<Proveedor[]> {
    return this.db.list<Proveedor>(this.proveedoresPath)
      .snapshotChanges()
      .pipe(
        map(changes => changes
          .map(c => ({ id: c.payload.key, ...c.payload.val() }))
          .filter(p => p.activo !== false)
          .sort((a, b) => a.nombre_comercial.localeCompare(b.nombre_comercial))
        )
      );
  }

  async crearProveedor(proveedorData: ProveedorFormData): Promise<string> {
    try {
      console.log('🔄 Creando proveedor:', proveedorData.nombre_comercial);

      const timestamp = new Date().toISOString();

      const proveedor: Proveedor = {
        ...proveedorData,
        productos_suministra: [],
        calificacion: 5,
        activo: true,
        created_at: timestamp,
        updated_at: timestamp
      };

      const ref = await this.db.list<Proveedor>(this.proveedoresPath).push(proveedor);
      await stampRtdbIdAfterPush(this.db, this.proveedoresPath, ref.key);
      console.log('✅ Proveedor creado con ID:', ref.key);
      return ref.key!;
    } catch (error) {
      console.error('❌ Error al crear proveedor:', error);
      throw error;
    }
  }

  actualizarProveedor(id: string, cambios: Partial<Proveedor>): Promise<void> {
    cambios.updated_at = new Date().toISOString();
    return this.db.object<Proveedor>(`${this.proveedoresPath}/${id}`).update(cambios);
  }

  // ==================== ALERTAS ====================

  private async verificarYCrearAlertas(productoId: string): Promise<void> {
    try {
      const producto = await firstValueFrom(this.getProductoById(productoId));
      if (!producto) return;

      console.log('🔔 Verificando alertas para:', producto.nombre);

      // Alerta de stock bajo
      if (producto.stock_actual <= producto.stock_minimo) {
        await this.crearAlerta({
          tipo: 'stock_bajo',
          prioridad: producto.stock_actual === 0 ? 'critica' : 'alta',
          producto_id: productoId,
          producto_nombre: producto.nombre,
          mensaje: `Stock bajo: ${producto.nombre} (${producto.stock_actual} ${producto.unidad_medida})`,
          fecha_alerta: new Date().toISOString(),
          estado: 'pendiente',
          created_at: new Date().toISOString()
        });
        console.log('⚠️ Alerta de stock bajo creada');
      }

      // Alerta de punto de reorden
      if (producto.stock_actual <= producto.punto_reorden && producto.stock_actual > producto.stock_minimo) {
        await this.crearAlerta({
          tipo: 'punto_reorden',
          prioridad: 'media',
          producto_id: productoId,
          producto_nombre: producto.nombre,
          mensaje: `Punto de reorden alcanzado: ${producto.nombre} (Stock: ${producto.stock_actual})`,
          fecha_alerta: new Date().toISOString(),
          estado: 'pendiente',
          created_at: new Date().toISOString()
        });
        console.log('⚠️ Alerta de punto de reorden creada');
      }
    } catch (error) {
      console.error('❌ Error al verificar alertas:', error);
    }
  }

  private async crearAlerta(alerta: Alerta): Promise<void> {
    try {
      // Verificar si ya existe alerta similar pendiente
      const alertas = await firstValueFrom(this.getAlertas());
      const existe = alertas.some(a => 
        a.producto_id === alerta.producto_id &&
        a.tipo === alerta.tipo &&
        a.estado === 'pendiente'
      );

      if (!existe) {
        await this.db.list(this.alertasPath).push(alerta);
        console.log('✅ Alerta creada');
      } else {
        console.log('ℹ️ Ya existe una alerta similar pendiente');
      }
    } catch (error) {
      console.error('❌ Error al crear alerta:', error);
    }
  }

  getAlertas(): Observable<Alerta[]> {
    return this.db.list<Alerta>(this.alertasPath)
      .snapshotChanges()
      .pipe(
        map(changes => {
          const alertas = changes
            .map(c => ({ id: c.payload.key, ...c.payload.val() }))
            .filter(a => a.estado !== 'resuelta' && a.estado !== 'ignorada')
            .sort((a, b) => {
              const prioridades = { critica: 4, alta: 3, media: 2, baja: 1 };
              return prioridades[b.prioridad] - prioridades[a.prioridad];
            });
          
          console.log(`🔔 ${alertas.length} alertas activas`);
          return alertas;
        })
      );
  }

  resolverAlerta(alertaId: string): Promise<void> {
    return this.db.object(`${this.alertasPath}/${alertaId}`).update({
      estado: 'resuelta',
      fecha_resolucion: new Date().toISOString()
    });
  }

  // ==================== ESTADÍSTICAS ====================

  async getEstadisticas(): Promise<EstadisticasInventario> {
    try {
      console.log('📊 Calculando estadísticas...');
      const productos = await firstValueFrom(this.getProductos());
      
      const stats: EstadisticasInventario = {
        total_productos: productos.length,
        valor_total_inventario: productos.reduce((sum, p) => 
          sum + (p.stock_actual * p.precio_compra), 0
        ),
        productos_bajo_stock: productos.filter(p => 
          p.stock_actual <= p.stock_minimo
        ).length,
        productos_por_caducar: 0,
        productos_caducados: 0,
        productos_sin_movimiento_30dias: 0,
        categorias_resumen: []
      };

      // Resumen por categorías
      const categorias = [...new Set(productos.map(p => p.categoria))];
      stats.categorias_resumen = categorias.map(cat => ({
        categoria: cat,
        cantidad_productos: productos.filter(p => p.categoria === cat).length,
        valor_total: productos
          .filter(p => p.categoria === cat)
          .reduce((sum, p) => sum + (p.stock_actual * p.precio_compra), 0)
      }));

      console.log('✅ Estadísticas calculadas');
      return stats;
    } catch (error) {
      console.error('❌ Error al calcular estadísticas:', error);
      throw error;
    }
  }

  // ==================== ÓRDENES DE COMPRA ====================
  
  getOrdenesCompra(): Observable<OrdenCompra[]> {
    return this.db.list<OrdenCompra>('Katzen/Inventario/OrdenesCompra')
      .snapshotChanges()
      .pipe(
        map(changes => changes.map(c => ({
          id: c.payload.key!,
          ...(c.payload.val() as OrdenCompra)
        })))
      );
  }

  async crearOrdenCompra(ordenData: any): Promise<void> {
    const folio = `OC-${Date.now()}`;
    const usuarioId = await this.currentStaff.getStaffId();
    const orden: OrdenCompra = {
      folio,
      proveedor_id: ordenData.proveedor_id,
      fecha_orden: ordenData.fecha_orden,
      fecha_entrega_esperada: ordenData.fecha_entrega_esperada,
      estado: 'borrador',
      items: ordenData.productos,
      subtotal: ordenData.subtotal,
      iva: ordenData.impuestos,
      total: ordenData.total,
      forma_pago: 'contado',
      pagada: false,
      usuario_solicita_id: usuarioId,
      observaciones: ordenData.observaciones,
      created_at: new Date().toISOString()
    };

    const ref = await this.db.list('Katzen/Inventario/OrdenesCompra').push(orden);
    if (ref.key) {
      await this.db.object(`Katzen/Inventario/OrdenesCompra/${ref.key}`).update({ id: ref.key });
    }
  }

  async recibirOrdenCompra(ordenId: string, productos: any[], observaciones: string): Promise<void> {
    // Actualizar cantidades recibidas en la orden
    const ordenRef = this.db.object(`Katzen/Inventario/OrdenesCompra/${ordenId}`);
    const orden = await firstValueFrom(ordenRef.valueChanges() as Observable<OrdenCompra>);
    
    if (orden) {
      // Actualizar items recibidos
      productos.forEach(p => {
        const item = orden.items.find(i => i.producto_id === p.producto_id);
        if (item) {
          item.cantidad_recibida += p.cantidad_a_recibir;
        }
      });

      // Determinar nuevo estado
      const todoRecibido = orden.items.every(i => i.cantidad_recibida >= i.cantidad_solicitada);
      const algoRecibido = orden.items.some(i => i.cantidad_recibida > 0);
      
      await ordenRef.update({
        items: orden.items,
        estado: todoRecibido ? 'recibida' : algoRecibido ? 'parcial' : orden.estado,
        fecha_entrega_real: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Registrar entradas de inventario
      for (const p of productos) {
        if (p.cantidad_a_recibir > 0) {
          const item = orden.items.find(i => i.producto_id === p.producto_id);
          const precioUnitario = item?.precio_unitario || 0;
          
          await this.registrarEntrada(
            p.producto_id,
            p.cantidad_a_recibir,
            precioUnitario,
            `Recepción de orden ${orden.folio}. ${observaciones}`,
            ordenId
          );
        }
      }
    }
  }

  async cancelarOrdenCompra(ordenId: string): Promise<void> {
    await this.db.object(`Katzen/Inventario/OrdenesCompra/${ordenId}`).update({
      estado: 'cancelada',
      updated_at: new Date().toISOString()
    });
  }

  async eliminarProveedor(proveedorId: string): Promise<void> {
    await this.db.object(`Katzen/Inventario/Proveedores/${proveedorId}`).update({
      activo: false,
      updated_at: new Date().toISOString()
    });
  }

  // ==================== ALERTAS AUTOMÁTICAS ====================
  
  async generarAlertasAutomaticas(): Promise<void> {
    console.log('🔄 Generando alertas automáticas...');
    
    const productos = await firstValueFrom(this.getProductos());
    const alertasPath = 'Katzen/Inventario/Alertas';
    
    for (const producto of productos) {
      if (!producto.id) continue;

      // Alerta de stock bajo
      if (producto.stock_actual <= producto.stock_minimo) {
        const prioridad = producto.stock_actual === 0 ? 'critica' : 
                         producto.stock_actual < producto.stock_minimo / 2 ? 'alta' : 'media';
        
        await this.db.list(alertasPath).push({
          tipo: 'stock_bajo',
          prioridad,
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          mensaje: `Stock bajo: ${producto.nombre} (${producto.stock_actual} ${producto.unidad_medida})`,
          fecha_alerta: new Date().toISOString(),
          estado: 'pendiente',
          created_at: new Date().toISOString()
        });
      }

      // Alerta de punto de reorden
      if (producto.stock_actual <= producto.punto_reorden && producto.stock_actual > producto.stock_minimo) {
        await this.db.list(alertasPath).push({
          tipo: 'punto_reorden',
          prioridad: 'media',
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          mensaje: `Punto de reorden alcanzado: ${producto.nombre}`,
          fecha_alerta: new Date().toISOString(),
          estado: 'pendiente',
          created_at: new Date().toISOString()
        });
      }

      // Alerta de productos por caducar
      if (producto.fecha_caducidad) {
        const fechaCaducidad = new Date(producto.fecha_caducidad);
        const hoy = new Date();
        const diasRestantes = Math.floor((fechaCaducidad.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diasRestantes <= 0) {
          await this.db.list(alertasPath).push({
            tipo: 'caducado',
            prioridad: 'critica',
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            mensaje: `Producto caducado: ${producto.nombre}`,
            fecha_alerta: new Date().toISOString(),
            estado: 'pendiente',
            created_at: new Date().toISOString()
          });
        } else if (diasRestantes <= producto.fecha_caducidad_alerta_dias) {
          const prioridad = diasRestantes <= 7 ? 'alta' : diasRestantes <= 15 ? 'media' : 'baja';
          
          await this.db.list(alertasPath).push({
            tipo: 'por_caducar',
            prioridad,
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            mensaje: `Producto por caducar en ${diasRestantes} días: ${producto.nombre}`,
            fecha_alerta: new Date().toISOString(),
            estado: 'pendiente',
            created_at: new Date().toISOString()
          });
        }
      }
    }
    
    console.log('✅ Alertas automáticas generadas');
  }
}

