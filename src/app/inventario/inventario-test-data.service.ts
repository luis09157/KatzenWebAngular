import { Injectable } from '@angular/core';
import { InventarioService } from './inventario.service';
import { ProductoFormData, ProveedorFormData } from '../shared/inventario.models';

@Injectable({
  providedIn: 'root'
})
export class InventarioTestDataService {

  constructor(private inventarioService: InventarioService) {}

  async crearDatosDePrueba(): Promise<void> {
    try {
      console.log('🚀 Iniciando creación de datos de prueba...');

      // 1. Crear proveedores
      console.log('\n📦 Creando proveedores...');
      const proveedor1Id = await this.inventarioService.crearProveedor({
        razon_social: 'Distribuidora Veterinaria del Norte S.A. de C.V.',
        nombre_comercial: 'VetNorte',
        rfc: 'DVN010101AAA',
        contacto_nombre: 'Juan Pérez',
        contacto_telefono: '8112345678',
        contacto_email: 'contacto@vetnorte.com',
        direccion: 'Av. Principal 123',
        ciudad: 'Monterrey',
        estado: 'Nuevo León',
        codigo_postal: '64000',
        dias_entrega: 3,
        condiciones_pago: 'Crédito 30 días'
      });
      console.log('✅ Proveedor VetNorte creado:', proveedor1Id);

      const proveedor2Id = await this.inventarioService.crearProveedor({
        razon_social: 'Medicamentos Veterinarios Premium S.A.',
        nombre_comercial: 'VetPremium',
        rfc: 'MVP020202BBB',
        contacto_nombre: 'María García',
        contacto_telefono: '8187654321',
        contacto_email: 'ventas@vetpremium.com',
        direccion: 'Calle Secundaria 456',
        ciudad: 'Guadalupe',
        estado: 'Nuevo León',
        codigo_postal: '67100',
        dias_entrega: 5,
        condiciones_pago: 'Contado'
      });
      console.log('✅ Proveedor VetPremium creado:', proveedor2Id);

      // 2. Crear productos de diferentes categorías
      console.log('\n💊 Creando productos de prueba...');

      // Medicamentos
      await this.crearProducto({
        codigo_barras: '7501234567890',
        nombre: 'Amoxicilina 500mg',
        descripcion: 'Antibiótico de amplio espectro para infecciones bacterianas',
        categoria: 'medicamento',
        subcategoria: 'Antibióticos',
        marca: 'Pfizer',
        presentacion: 'Caja con 20 comprimidos',
        unidad_medida: 'unidad',
        stock_minimo: 10,
        stock_maximo: 100,
        punto_reorden: 20,
        ubicacion_almacen: 'Estante A1',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 60,
        precio_compra: 120.00,
        precio_venta: 180.00,
        iva_aplicable: true,
        proveedor_principal_id: proveedor1Id,
        requiere_receta: true,
        controlado: false
      }, 'Amoxicilina 500mg');

      await this.crearProducto({
        codigo_barras: '7501234567891',
        nombre: 'Meloxicam 15mg',
        descripcion: 'Antiinflamatorio no esteroideo para dolor y inflamación',
        categoria: 'medicamento',
        subcategoria: 'Antiinflamatorios',
        marca: 'Bayer',
        presentacion: 'Frasco con 20ml',
        unidad_medida: 'ml',
        stock_minimo: 5,
        stock_maximo: 50,
        punto_reorden: 10,
        ubicacion_almacen: 'Estante A2',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 90,
        precio_compra: 250.00,
        precio_venta: 380.00,
        iva_aplicable: true,
        proveedor_principal_id: proveedor1Id,
        requiere_receta: true,
        controlado: false
      }, 'Meloxicam 15mg');

      // Material Quirúrgico
      await this.crearProducto({
        codigo_barras: '7501234567892',
        nombre: 'Guantes de Látex Talla M',
        descripcion: 'Guantes desechables para procedimientos veterinarios',
        categoria: 'quirurgico',
        subcategoria: 'Protección',
        marca: 'MediCare',
        presentacion: 'Caja con 100 unidades',
        unidad_medida: 'caja',
        stock_minimo: 3,
        stock_maximo: 20,
        punto_reorden: 5,
        ubicacion_almacen: 'Estante B1',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 180,
        precio_compra: 80.00,
        precio_venta: 120.00,
        iva_aplicable: true,
        proveedor_principal_id: proveedor2Id,
        requiere_receta: false,
        controlado: false
      }, 'Guantes de Látex');

      // Alimentos
      await this.crearProducto({
        codigo_barras: '7501234567893',
        nombre: 'Alimento Medicado Renal para Gatos',
        descripcion: 'Dieta especial para gatos con problemas renales',
        categoria: 'alimento',
        subcategoria: 'Alimentos Medicados',
        marca: 'Royal Canin',
        presentacion: 'Bolsa de 2kg',
        unidad_medida: 'kg',
        stock_minimo: 5,
        stock_maximo: 30,
        punto_reorden: 8,
        ubicacion_almacen: 'Bodega A',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 30,
        precio_compra: 450.00,
        precio_venta: 680.00,
        iva_aplicable: false,
        proveedor_principal_id: proveedor2Id,
        requiere_receta: true,
        controlado: false
      }, 'Alimento Renal Gatos');

      // Productos de Peluquería
      await this.crearProducto({
        codigo_barras: '7501234567894',
        nombre: 'Shampoo Hipoalergénico Canino',
        descripcion: 'Shampoo suave para perros con piel sensible',
        categoria: 'peluqueria',
        subcategoria: 'Shampoos',
        marca: 'Pet Clean',
        presentacion: 'Botella de 500ml',
        unidad_medida: 'ml',
        stock_minimo: 6,
        stock_maximo: 40,
        punto_reorden: 10,
        ubicacion_almacen: 'Estante C2',
        requiere_refrigeracion: false,
        fecha_caducidad_alerta_dias: 365,
        precio_compra: 85.00,
        precio_venta: 150.00,
        iva_aplicable: true,
        proveedor_principal_id: proveedor2Id,
        requiere_receta: false,
        controlado: false
      }, 'Shampoo Hipoalergénico');

      // Material de Diagnóstico
      await this.crearProducto({
        codigo_barras: '7501234567895',
        nombre: 'Test Rápido Parvovirosis Canina',
        descripcion: 'Kit de diagnóstico rápido para parvovirus',
        categoria: 'diagnostico',
        subcategoria: 'Tests Rápidos',
        marca: 'VetTest',
        presentacion: 'Kit individual',
        unidad_medida: 'unidad',
        stock_minimo: 10,
        stock_maximo: 50,
        punto_reorden: 15,
        ubicacion_almacen: 'Refrigerador 1',
        requiere_refrigeracion: true,
        fecha_caducidad_alerta_dias: 30,
        precio_compra: 180.00,
        precio_venta: 320.00,
        iva_aplicable: true,
        proveedor_principal_id: proveedor1Id,
        requiere_receta: false,
        controlado: false
      }, 'Test Parvovirus');

      console.log('\n✅ Todos los productos de prueba creados exitosamente');

      // 3. Registrar algunas entradas de stock
      console.log('\n📥 Registrando entradas de inventario...');
      
      const productos = await this.inventarioService.getProductos().toPromise();
      
      for (const producto of productos || []) {
        if (producto.id) {
          const cantidadEntrada = Math.floor(Math.random() * 20) + 10; // Entre 10 y 30 unidades
          await this.inventarioService.registrarEntrada(
            producto.id,
            cantidadEntrada,
            producto.precio_compra,
            'Stock inicial de prueba'
          );
          console.log(`✅ Entrada registrada para ${producto.nombre}: ${cantidadEntrada} ${producto.unidad_medida}`);
        }
      }

      console.log('\n🎉 ¡Datos de prueba creados exitosamente!');
      console.log('📊 Puedes ver los productos en: /admin/inventario/productos');
      
    } catch (error) {
      console.error('❌ Error al crear datos de prueba:', error);
      throw error;
    }
  }

  private async crearProducto(data: ProductoFormData, nombre: string): Promise<void> {
    try {
      const id = await this.inventarioService.crearProducto(data);
      console.log(`✅ ${nombre} creado con ID: ${id}`);
    } catch (error: any) {
      console.error(`❌ Error al crear ${nombre}:`, error.message);
    }
  }
}

