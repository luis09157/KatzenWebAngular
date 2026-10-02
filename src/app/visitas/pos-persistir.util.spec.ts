import { Producto } from '../shared/inventario.models';
import { MENSAJE_KIT_SIN_BOM } from './pos-kit-bom.util';
import {
  asegurarSalidasProducto,
  ejecutarPersistirVisita,
  PersistirVisitaDeps,
  PersistirVisitaContexto,
  resolverClientePersistir,
} from './pos-persistir.util';
import { CLIENTE_MOSTRADOR_ID, CLIENTE_MOSTRADOR_NOMBRE } from './visita-mostrador.util';
import { VisitaLinea } from './visitas.models';

function lineaProducto(partial: Partial<VisitaLinea> & { id: string; productoId: string }): VisitaLinea {
  return {
    descripcion: partial.descripcion || 'Prod',
    monto: partial.monto ?? 10,
    categoria: 'venta_producto',
    cantidad: partial.cantidad ?? 1,
    ...partial,
  };
}

function producto(partial: Partial<Producto> & { id: string; nombre: string }): Producto {
  return {
    activo: true,
    stock_actual: 100,
    precio_venta: 10,
    ...partial,
  } as Producto;
}

describe('pos-persistir (spec 080)', () => {
  describe('resolverClientePersistir', () => {
    it('mostrador por flag o id', () => {
      expect(resolverClientePersistir(true, 'c1', 'Ana')).toEqual({
        esMostrador: true,
        clienteId: CLIENTE_MOSTRADOR_ID,
        clienteNombre: CLIENTE_MOSTRADOR_NOMBRE,
      });
      expect(resolverClientePersistir(false, CLIENTE_MOSTRADOR_ID, 'x')).toEqual({
        esMostrador: true,
        clienteId: CLIENTE_MOSTRADOR_ID,
        clienteNombre: CLIENTE_MOSTRADOR_NOMBRE,
      });
    });

    it('cliente real', () => {
      expect(resolverClientePersistir(false, ' c1 ', ' Ana ')).toEqual({
        esMostrador: false,
        clienteId: 'c1',
        clienteNombre: 'Ana',
      });
    });
  });

  describe('asegurarSalidasProducto', () => {
    it('omite demo y deja líneas no-producto', async () => {
      const calls: string[] = [];
      const demoId = 'demo-pos-shampoo';
      const lineas: VisitaLinea[] = [
        lineaProducto({ id: 'l1', productoId: demoId, descripcion: 'Demo' }),
        {
          id: 'l2',
          descripcion: 'Consulta',
          monto: 200,
          categoria: 'consulta',
        },
      ];
      const out = await asegurarSalidasProducto(
        lineas,
        'pac1',
        {
          productosCatalogo: [producto({ id: demoId, nombre: 'Demo', soloDemo: true })],
          visitaId: '',
        },
        {
          registrarSalida: async (pid) => {
            calls.push(pid);
            return 'mov';
          },
        }
      );
      // demo se omite (continue); consulta se conserva
      expect(out.map((l) => l.id)).toEqual(['l2']);
      expect(calls).toEqual([]);
    });

    it('producto simple: una salida y guarda movimientoInventarioId', async () => {
      const calls: Array<{ pid: string; qty: number; obs: string; visitaId: string }> = [];
      const cat = [producto({ id: 'p1', nombre: 'Shampoo' })];
      const out = await asegurarSalidasProducto(
        [lineaProducto({ id: 'l1', productoId: 'p1', descripcion: 'Shampoo', cantidad: 2 })],
        'pac1',
        { productosCatalogo: cat, visitaId: 'v1' },
        {
          registrarSalida: async (pid, qty, _m, _pac, _h, _v, obs, visitaId) => {
            calls.push({ pid, qty, obs, visitaId });
            return 'mov-1';
          },
        }
      );
      expect(out[0].movimientoInventarioId).toBe('mov-1');
      expect(out[0].cantidad).toBe(2);
      expect(calls).toEqual([
        {
          pid: 'p1',
          qty: 2,
          obs: 'Ticket visita · Shampoo',
          visitaId: 'v1',
        },
      ]);
    });

    it('kit con BOM: N salidas de componentes; id del primero en la línea', async () => {
      const calls: string[] = [];
      const cat = [
        producto({
          id: 'kit1',
          nombre: 'Paquete',
          esKit: true,
          pdvCodigo: 'PAQ',
          kitComponentes: [
            { codigo: 'CA', cantidad: 1 },
            { codigo: 'CB', cantidad: 2 },
          ],
        }),
        producto({ id: 'ca', nombre: 'Comp A', pdvCodigo: 'CA', stock_actual: 10 }),
        producto({ id: 'cb', nombre: 'Comp B', pdvCodigo: 'CB', stock_actual: 10 }),
      ];
      const out = await asegurarSalidasProducto(
        [lineaProducto({ id: 'l1', productoId: 'kit1', cantidad: 1 })],
        '',
        { productosCatalogo: cat, visitaId: '' },
        {
          registrarSalida: async (pid) => {
            calls.push(pid);
            return `mov-${pid}`;
          },
        }
      );
      expect(calls).toEqual(['ca', 'cb']);
      expect(out[0].movimientoInventarioId).toBe('mov-ca');
    });

    it('kit sin BOM: lanza mensaje canónico', async () => {
      const cat = [
        producto({
          id: 'kit1',
          nombre: 'Paquete vacío',
          esKit: true,
          kitComponentes: [],
        }),
      ];
      await expectAsync(
        asegurarSalidasProducto(
          [lineaProducto({ id: 'l1', productoId: 'kit1' })],
          '',
          { productosCatalogo: cat, visitaId: '' },
          { registrarSalida: async () => 'x' }
        )
      ).toBeRejectedWithError(MENSAJE_KIT_SIN_BOM);
    });

    it('no re-registra si ya hay movimientoInventarioId', async () => {
      let called = 0;
      const out = await asegurarSalidasProducto(
        [
          lineaProducto({
            id: 'l1',
            productoId: 'p1',
            movimientoInventarioId: 'ya',
          }),
        ],
        '',
        { productosCatalogo: [producto({ id: 'p1', nombre: 'X' })], visitaId: '' },
        {
          registrarSalida: async () => {
            called++;
            return 'n';
          },
        }
      );
      expect(called).toBe(0);
      expect(out[0].movimientoInventarioId).toBe('ya');
    });
  });

  describe('ejecutarPersistirVisita', () => {
    const baseLinea = lineaProducto({ id: 'l1', productoId: 'p1', descripcion: 'Shampoo' });
    const cat = [producto({ id: 'p1', nombre: 'Shampoo' })];

    function baseCtx(over: Partial<PersistirVisitaContexto> = {}): PersistirVisitaContexto {
      return {
        soloLectura: false,
        modoMostrador: false,
        visitaId: null,
        lineas: [baseLinea],
        productosCatalogo: cat,
        form: {
          cliente_id: 'c1',
          cliente: 'Ana',
          paciente_id: 'pac1',
          paciente: 'Michi',
          fecha: '2026-10-01',
          notas: '',
        },
        pagado: 0,
        ...over,
      };
    }

    function baseDeps(over: Partial<PersistirVisitaDeps> = {}): PersistirVisitaDeps {
      return {
        buscarVisitaAbiertaDelDia: async () => null,
        confirmarUsarTicketExistente: async () => false,
        actualizarVisita: async () => undefined,
        crearVisita: async () => 'new-id',
        vincularOrigenesDesdeLineas: async () => undefined,
        registrarSalida: async () => 'mov-1',
        ...over,
      };
    }

    it('rechaza soloLectura / sin cliente / sin fecha', async () => {
      await expectAsync(ejecutarPersistirVisita(baseCtx({ soloLectura: true }), baseDeps())).toBeRejectedWithError(
        /cerrado o cancelado/
      );
      await expectAsync(
        ejecutarPersistirVisita(baseCtx({ form: { cliente_id: '', cliente: '', fecha: '2026-10-01' } }), baseDeps())
      ).toBeRejectedWithError(/dueño/);
      await expectAsync(
        ejecutarPersistirVisita(baseCtx({ form: { cliente_id: 'c1', cliente: 'Ana', fecha: '  ' } }), baseDeps())
      ).toBeRejectedWithError(/fecha/);
    });

    it('mostrador crea sin buscar ticket abierto', async () => {
      const buscar = jasmine.createSpy('buscar').and.resolveTo(null);
      const crear = jasmine.createSpy('crear').and.resolveTo('v-mostrador');
      const r = await ejecutarPersistirVisita(
        baseCtx({
          modoMostrador: true,
          form: { cliente_id: '', cliente: '', fecha: '2026-10-01' },
        }),
        baseDeps({ buscarVisitaAbiertaDelDia: buscar, crearVisita: crear })
      );
      expect(buscar).not.toHaveBeenCalled();
      expect(crear).toHaveBeenCalled();
      const payload = crear.calls.mostRecent().args[0];
      expect(payload.cliente_id).toBe(CLIENTE_MOSTRADOR_ID);
      expect(payload.esMostrador).toBeTrue();
      expect(payload.paciente).toBe('');
      expect(r.visitaId).toBe('v-mostrador');
      expect(r.lineas[0].movimientoInventarioId).toBe('mov-1');
    });

    it('actualiza si ya hay visitaId y vincula orígenes (baños)', async () => {
      const actualizar = jasmine.createSpy('upd').and.resolveTo(undefined);
      const crear = jasmine.createSpy('crear');
      const vincular = jasmine.createSpy('vinc').and.resolveTo(undefined);
      const r = await ejecutarPersistirVisita(
        baseCtx({
          visitaId: 'v-exist',
          lineas: [
            {
              id: 'l-banio',
              descripcion: 'Baño · Oreon',
              monto: 200,
              categoria: 'banio',
              banioId: 'b1',
            },
          ],
        }),
        baseDeps({ actualizarVisita: actualizar, crearVisita: crear, vincularOrigenesDesdeLineas: vincular })
      );
      expect(actualizar).toHaveBeenCalled();
      expect(crear).not.toHaveBeenCalled();
      expect(vincular).toHaveBeenCalledWith('v-exist', jasmine.any(Array));
      expect(r.visitaId).toBe('v-exist');
      expect(r.esEdicion).toBeTrue();
    });

    it('adopta ticket abierto si confirma', async () => {
      const actualizar = jasmine.createSpy('upd').and.resolveTo(undefined);
      const r = await ejecutarPersistirVisita(
        baseCtx(),
        baseDeps({
          buscarVisitaAbiertaDelDia: async () => ({
            id: 'v-old',
            cliente: 'Ana',
            fecha: '2026-10-01',
            saldo: 50,
            pagado: 20,
            estado: 'parcial',
            lineas: [
              {
                id: 'old',
                descripcion: 'Consulta',
                monto: 50,
                categoria: 'consulta',
              },
            ],
          }),
          confirmarUsarTicketExistente: async () => true,
          actualizarVisita: actualizar,
        })
      );
      expect(r.visitaId).toBe('v-old');
      expect(r.adoptadoTicketExistente).toBeTrue();
      expect(r.pagado).toBe(20);
      expect(r.estadoLabel).toBe('Pago parcial');
      expect(r.lineas.some((l) => l.id === 'old')).toBeTrue();
      expect(actualizar).toHaveBeenCalled();
    });

    it('crea nuevo si rechaza ticket abierto; vincula orígenes', async () => {
      const vincular = jasmine.createSpy('vinc').and.resolveTo(undefined);
      const r = await ejecutarPersistirVisita(
        baseCtx(),
        baseDeps({
          buscarVisitaAbiertaDelDia: async () => ({
            id: 'v-old',
            fecha: '2026-10-01',
            saldo: 10,
            estado: 'abierta',
          }),
          confirmarUsarTicketExistente: async () => false,
          crearVisita: async () => 'v-new',
          vincularOrigenesDesdeLineas: vincular,
        })
      );
      expect(r.visitaId).toBe('v-new');
      expect(r.adoptadoTicketExistente).toBeFalse();
      expect(vincular).toHaveBeenCalled();
    });

    it('falla si solo hay líneas demo', async () => {
      await expectAsync(
        ejecutarPersistirVisita(
          baseCtx({
            modoMostrador: true,
            lineas: [lineaProducto({ id: 'd1', productoId: 'demo-pos-x' })],
            productosCatalogo: [],
            form: { fecha: '2026-10-01' },
          }),
          baseDeps()
        )
      ).toBeRejectedWithError(/catálogo de muestra/);
    });
  });
});
