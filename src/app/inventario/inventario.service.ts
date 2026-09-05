import { Injectable } from '@angular/core';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { Observable, map, catchError, throwError, firstValueFrom, of } from 'rxjs';
import {
  Producto,
  ProductoFormData,
  Movimiento,
  Proveedor,
  ProveedorFormData,
  OrdenCompra,
  Alerta,
  EstadisticasInventario,
} from '../shared/inventario.models';
import { CurrentStaffService } from '../core/services/current-staff.service';
import { AuthProfileService } from '../core/services/auth-profile.service';
import { staffRoleIsVeterinarioOperativo } from '../core/config/staff-role.config';
import { stampRtdbIdAfterPush } from '../core/utils/rtdb-push.util';
import { calcularNuevoStock, validarMotivoMovimiento } from './inventario-stock.util';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private readonly productosPath = 'Katzen/Inventario/Productos';
  private readonly movimientosPath = 'Katzen/Inventario/Movimientos';
  private readonly proveedoresPath = 'Katzen/Inventario/Proveedores';
  private readonly alertasPath = 'Katzen/Inventario/Alertas';

  constructor(
    private db: AngularFireDatabase,
    private currentStaff: CurrentStaffService,
    private authProfile: AuthProfileService
  ) {
    console.log('✅ InventarioService inicializado');
  }

  // ==================== PRODUCTOS ====================

  getProductos(): Observable<Producto[]> {
    console.log('🔄 Obteniendo productos...');
    return this.db
      .list<Producto>(this.productosPath)
      .snapshotChanges()
      .pipe(
        map((changes) => {
          const productos = changes
            .map((c) => ({ id: c.payload.key, ...c.payload.val() }))
            .filter((p) => p.activo !== false)
            .sort((a, b) => a.nombre.localeCompare(b.nombre));

          console.log(`✅ ${productos.length} productos obtenidos`);
          return productos;
        }),
        catchError((error) => {
          console.error('❌ Error al obtener productos:', error);
          return throwError(() => error);
        })
      );
  }

  getProductosPorCategoria(categoria: string): Observable<Producto[]> {
    return this.getProductos().pipe(map((productos) => productos.filter((p) => p.categoria === categoria)));
  }

  getProductosBajoStock(): Observable<Producto[]> {
    return this.getProductos().pipe(map((productos) => productos.filter((p) => p.stock_actual <= p.stock_minimo)));
  }

  getProductosPorCaducar(dias: number = 30): Observable<Producto[]> {
    const hoy = new Date();
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + dias);

    return this.getProductos().pipe(
      map((productos) =>
        productos.filter((p) => {
          if (!p.fecha_caducidad) return false;
          const fechaCad = new Date(p.fecha_caducidad);
          return fechaCad <= fechaLimite && fechaCad >= hoy;
        })
      )
    );
  }

  getProductoById(id: string): Observable<Producto | null> {
    return this.db
      .object<Producto>(`${this.productosPath}/${id}`)
      .valueChanges()
      .pipe(map((producto) => (producto ? { id, ...producto } : null)));
  }

  async crearProducto(productoData: ProductoFormData): Promise<string> {
    try {
      console.log('🔄 Creando producto:', productoData.nombre);

      // Validar código de barras único
      const productos = await firstValueFrom(this.getProductos());
      const duplicado = productos.find((p) => p.codigo_barras === productoData.codigo_barras);

      if (duplicado) {
        throw new Error('Ya existe un producto con este código de barras');
      }

      // Calcular margen de ganancia
      if (!(productoData.precio_venta > productoData.precio_compra)) {
        throw new Error(
          'El costo debe ser menor que el precio de venta. Si el costo es igual o mayor a la venta, no hay ganancia.'
        );
      }

      const margen =
        productoData.precio_compra > 0
          ? ((productoData.precio_venta - productoData.precio_compra) / productoData.precio_compra) * 100
          : 0;

      const timestamp = new Date().toISOString();
      const { stock_inicial, ...productoSinInicial } = productoData;

      const producto: Producto = {
        ...productoSinInicial,
        tasa_iva: productoData.tasa_iva != null ? Number(productoData.tasa_iva) : productoData.iva_aplicable ? 16 : 0,
        stock_actual: Number(stock_inicial) || 0,
        margen_ganancia: parseFloat(margen.toFixed(2)),
        proveedores_alternos: [],
        activo: true,
        created_at: timestamp,
        updated_at: timestamp,
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

          if (!(precioVenta > precioCompra)) {
            throw new Error(
              'El costo debe ser menor que el precio de venta. Si el costo es igual o mayor a la venta, no hay ganancia.'
            );
          }

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
      map((productos) =>
        productos.filter(
          (p) =>
            p.nombre.toLowerCase().includes(textoLower) ||
            p.codigo_barras.toLowerCase().includes(textoLower) ||
            p.descripcion.toLowerCase().includes(textoLower) ||
            p.marca.toLowerCase().includes(textoLower)
        )
      )
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
    await this.registrarMovimiento({
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
      created_at: new Date().toISOString(),
    });
  }

  async registrarSalida(
    productoId: string,
    cantidad: number,
    motivo: string,
    pacienteId?: string,
    historialId?: string,
    ventaId?: string,
    observaciones?: string,
    /** Spec 042/045 — ticket de visita del día. */
    visitaId?: string
  ): Promise<string> {
    console.log('🔄 Registrando salida de producto...');
    const usuarioId = await this.currentStaff.getStaffId();
    const snap = await this.db.database.ref(`${this.productosPath}/${productoId}`).once('value');
    const producto = snap.val() as { precio_compra?: number } | null;
    const costoUnitario = Math.max(0, Number(producto?.precio_compra) || 0);
    const qty = Number(cantidad) || 0;
    const movimiento: Movimiento = {
      tipo: 'salida',
      producto_id: productoId,
      cantidad: cantidad,
      costo_unitario: costoUnitario,
      costo_total: Math.round(costoUnitario * qty * 100) / 100,
      motivo: motivo,
      usuario_responsable_id: usuarioId,
      observaciones: observaciones || '',
      cantidad_anterior: 0,
      cantidad_nueva: 0,
      created_at: new Date().toISOString(),
    };
    // Spec 065 — venta de mostrador: no hay paciente/visita aún; RTDB rechaza `undefined`.
    if (pacienteId) movimiento.paciente_id = pacienteId;
    if (historialId) movimiento.historial_clinico_id = historialId;
    if (ventaId) movimiento.venta_id = ventaId;
    if (visitaId) movimiento.visitaId = visitaId;
    return this.registrarMovimiento(movimiento);
  }

  async registrarMerma(productoId: string, cantidad: number, motivo: string, observaciones?: string): Promise<string> {
    console.log('🔄 Registrando merma de producto...');
    const usuarioId = await this.currentStaff.getStaffId();
    return this.registrarMovimiento({
      tipo: 'merma',
      producto_id: productoId,
      cantidad: cantidad,
      costo_unitario: 0,
      costo_total: 0,
      motivo: motivo,
      usuario_responsable_id: usuarioId,
      observaciones: observaciones || '',
      cantidad_anterior: 0,
      cantidad_nueva: 0,
      created_at: new Date().toISOString(),
    });
  }

  async registrarAjuste(productoId: string, nuevoStock: number, motivo: string, observaciones?: string): Promise<void> {
    console.log('🔄 Registrando ajuste de inventario...');
    await this.assertPuedeRegistrarAjuste();
    const usuarioId = await this.currentStaff.getStaffId();
    await this.registrarMovimiento({
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
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Autorización supervisor ligera (decisión #12): administrador o doctor.
   * Flujo dual / PIN formal = SC futuro (spec 007 SC-009).
   */
  async assertPuedeRegistrarAjuste(): Promise<void> {
    const role = await this.authProfile.getEffectiveStaffRole();
    if (!staffRoleIsVeterinarioOperativo(role)) {
      throw new Error('Solo un supervisor (administrador o veterinario) puede registrar ajustes de inventario');
    }
  }

  private async registrarMovimiento(movimiento: Movimiento): Promise<string> {
    try {
      console.log('🔄 Registrando movimiento:', movimiento.tipo);

      const motivoError = validarMotivoMovimiento(movimiento.tipo, movimiento.motivo);
      if (motivoError) {
        throw new Error(motivoError);
      }

      const productoPath = `${this.productosPath}/${movimiento.producto_id}`;
      let stockError: string | null = null;

      const txResult = await this.db.database.ref(productoPath).transaction((producto) => {
        if (!producto) {
          stockError = 'Producto no encontrado';
          return undefined;
        }

        const cantidadAnterior = producto.stock_actual ?? 0;
        const calculo = calcularNuevoStock(movimiento.tipo, cantidadAnterior, movimiento.cantidad);

        if (calculo.ok === false) {
          stockError = calculo.error;
          return undefined;
        }

        movimiento.cantidad_anterior = cantidadAnterior;
        movimiento.cantidad_nueva = calculo.nuevoStock;
        return { ...producto, stock_actual: calculo.nuevoStock };
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
      return ref.key!;
    } catch (error) {
      console.error('❌ Error al registrar movimiento:', error);
      throw error;
    }
  }

  async vincularMovimientoACaja(movimientoId: string, cajaMovimientoId: string): Promise<void> {
    await this.db.object(`${this.movimientosPath}/${movimientoId}`).update({
      cajaMovimientoId,
    });
  }

  getMovimientosPorProducto(productoId: string): Observable<Movimiento[]> {
    return this.db
      .list<Movimiento>(this.movimientosPath)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key, ...c.payload.val() }))
            .filter((m) => m.producto_id === productoId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        )
      );
  }

  /** Spec 022 — salidas ligadas a un historial clínico. */
  getMovimientosPorHistorial(historialId: string): Observable<Movimiento[]> {
    if (!historialId) {
      return of([]);
    }
    return this.db
      .list<Movimiento>(this.movimientosPath, (ref) => ref.orderByChild('historial_clinico_id').equalTo(historialId))
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key!, ...(c.payload.val() as Movimiento) }))
            .filter((m) => m.tipo === 'salida' || m.tipo === 'merma')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        )
      );
  }

  /** Suma costo_total de salidas de un historial (sugerencia costoAsociado). */
  sumarCostoConsumos(movimientos: Movimiento[]): number {
    return Math.round((movimientos || []).reduce((acc, m) => acc + (Number(m.costo_total) || 0), 0) * 100) / 100;
  }

  getTodosLosMovimientos(): Observable<Movimiento[]> {
    return this.db
      .list<Movimiento>(this.movimientosPath)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key, ...c.payload.val() }))
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        )
      );
  }

  // ==================== PROVEEDORES ====================

  /** Solo proveedores activos (selects de producto/OC y listado admin). Borrados = activo:false. */
  getProveedores(): Observable<Proveedor[]> {
    return this.db
      .list<Proveedor>(this.proveedoresPath)
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes
            .map((c) => ({ id: c.payload.key, ...c.payload.val() }))
            .filter((p) => p.activo !== false)
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
        updated_at: timestamp,
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
          created_at: new Date().toISOString(),
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
          created_at: new Date().toISOString(),
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
      const existe = alertas.some(
        (a) => a.producto_id === alerta.producto_id && a.tipo === alerta.tipo && a.estado === 'pendiente'
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
    return this.db
      .list<Alerta>(this.alertasPath)
      .snapshotChanges()
      .pipe(
        map((changes) => {
          const alertas = changes
            .map((c) => ({ id: c.payload.key, ...c.payload.val() }))
            .filter((a) => a.estado !== 'resuelta' && a.estado !== 'ignorada')
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
      fecha_resolucion: new Date().toISOString(),
    });
  }

  // ==================== ESTADÍSTICAS ====================

  async getEstadisticas(): Promise<EstadisticasInventario> {
    try {
      console.log('📊 Calculando estadísticas...');
      const productos = await firstValueFrom(this.getProductos());
      const activos = productos.filter((p) => p.activo !== false && (p.stock_actual || 0) > 0);
      const invertido = activos.reduce(
        (sum, p) => sum + (Number(p.stock_actual) || 0) * (Number(p.precio_compra) || 0),
        0
      );
      const valorVenta = activos.reduce(
        (sum, p) => sum + (Number(p.stock_actual) || 0) * (Number(p.precio_venta) || 0),
        0
      );

      const stats: EstadisticasInventario = {
        total_productos: productos.filter((p) => p.activo !== false).length,
        valor_total_inventario: invertido,
        invertido_costo: invertido,
        valor_precio_venta: valorVenta,
        margen_potencial: valorVenta - invertido,
        productos_bajo_stock: productos.filter((p) => p.activo !== false && p.stock_actual <= p.stock_minimo).length,
        productos_por_caducar: 0,
        productos_caducados: 0,
        productos_sin_movimiento_30dias: 0,
        categorias_resumen: [],
      };

      // Resumen por categorías (a costo)
      const categorias = [...new Set(productos.filter((p) => p.activo !== false).map((p) => p.categoria))];
      stats.categorias_resumen = categorias.map((cat) => ({
        categoria: cat,
        cantidad_productos: productos.filter((p) => p.activo !== false && p.categoria === cat).length,
        valor_total: productos
          .filter((p) => p.activo !== false && p.categoria === cat && (p.stock_actual || 0) > 0)
          .reduce((sum, p) => sum + (p.stock_actual || 0) * (p.precio_compra || 0), 0),
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
    return this.db
      .list<OrdenCompra>('Katzen/Inventario/OrdenesCompra')
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({
            id: c.payload.key!,
            ...(c.payload.val() as OrdenCompra),
          }))
        )
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
      created_at: new Date().toISOString(),
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
      productos.forEach((p) => {
        const item = orden.items.find((i) => i.producto_id === p.producto_id);
        if (item) {
          item.cantidad_recibida += p.cantidad_a_recibir;
        }
      });

      // Determinar nuevo estado
      const todoRecibido = orden.items.every((i) => i.cantidad_recibida >= i.cantidad_solicitada);
      const algoRecibido = orden.items.some((i) => i.cantidad_recibida > 0);

      await ordenRef.update({
        items: orden.items,
        estado: todoRecibido ? 'recibida' : algoRecibido ? 'parcial' : orden.estado,
        fecha_entrega_real: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Registrar entradas de inventario
      for (const p of productos) {
        if (p.cantidad_a_recibir > 0) {
          const item = orden.items.find((i) => i.producto_id === p.producto_id);
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
      await this.generarAlertasAutomaticas();
    }
  }

  async cancelarOrdenCompra(ordenId: string): Promise<void> {
    await this.db.object(`Katzen/Inventario/OrdenesCompra/${ordenId}`).update({
      estado: 'cancelada',
      updated_at: new Date().toISOString(),
    });
  }

  /** Spec 022 Fase E — vincular egreso de caja a la OC (aditivo). */
  async vincularOrdenACaja(ordenId: string, cajaMovimientoId: string, marcarPagada = true): Promise<void> {
    const patch: Record<string, unknown> = {
      cajaMovimientoId,
      updated_at: new Date().toISOString(),
    };
    if (marcarPagada) {
      patch['pagada'] = true;
    }
    await this.db.object(`Katzen/Inventario/OrdenesCompra/${ordenId}`).update(patch);
  }

  async eliminarProveedor(proveedorId: string): Promise<void> {
    await this.db.object(`Katzen/Inventario/Proveedores/${proveedorId}`).update({
      activo: false,
      updated_at: new Date().toISOString(),
    });
  }

  // ==================== ALERTAS AUTOMÁTICAS ====================

  async generarAlertasAutomaticas(): Promise<void> {
    const productos = await firstValueFrom(this.getProductos());
    const ahora = new Date().toISOString();

    for (const producto of productos) {
      if (!producto.id) continue;

      if (producto.stock_actual <= producto.stock_minimo) {
        const prioridad =
          producto.stock_actual === 0
            ? 'critica'
            : producto.stock_actual < producto.stock_minimo / 2
              ? 'alta'
              : 'media';

        await this.crearAlerta({
          tipo: 'stock_bajo',
          prioridad,
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          mensaje: `Stock bajo: ${producto.nombre} (${producto.stock_actual} ${producto.unidad_medida})`,
          fecha_alerta: ahora,
          estado: 'pendiente',
          created_at: ahora,
        });
      }

      if (producto.stock_actual <= producto.punto_reorden && producto.stock_actual > producto.stock_minimo) {
        await this.crearAlerta({
          tipo: 'punto_reorden',
          prioridad: 'media',
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          mensaje: `Punto de reorden alcanzado: ${producto.nombre}`,
          fecha_alerta: ahora,
          estado: 'pendiente',
          created_at: ahora,
        });
      }

      if (producto.fecha_caducidad) {
        const fechaCaducidad = new Date(producto.fecha_caducidad);
        const hoy = new Date();
        const diasRestantes = Math.floor((fechaCaducidad.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes <= 0) {
          await this.crearAlerta({
            tipo: 'caducado',
            prioridad: 'critica',
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            mensaje: `Producto caducado: ${producto.nombre}`,
            fecha_alerta: ahora,
            estado: 'pendiente',
            created_at: ahora,
          });
        } else if (diasRestantes <= producto.fecha_caducidad_alerta_dias) {
          const prioridad = diasRestantes <= 7 ? 'alta' : diasRestantes <= 15 ? 'media' : 'baja';
          await this.crearAlerta({
            tipo: 'por_caducar',
            prioridad,
            producto_id: producto.id,
            producto_nombre: producto.nombre,
            mensaje: `Producto por caducar en ${diasRestantes} días: ${producto.nombre}`,
            fecha_alerta: ahora,
            estado: 'pendiente',
            created_at: ahora,
          });
        }
      }
    }
  }
}
