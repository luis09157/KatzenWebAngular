import {
  CTX_ERROR_COBRAR_VISITA,
  CTX_ERROR_GUARDAR_VISITA,
  construirEstadoPostCobro,
  esPagoParcial,
  ejecutarFlujoCobro,
  ejecutarFlujoGuardar,
  mensajeToastCobro,
  validarPrecondicionesCobro,
} from './pos-orquestacion.util';

describe('pos-orquestacion (spec 079)', () => {
  describe('validarPrecondicionesCobro', () => {
    const baseOk = {
      soloLectura: false,
      puedeCobrar: true,
      lineasCount: 1,
      saldo: 100,
      mixto: false,
      metodoPago: 'efectivo',
      monto: 100,
      montoEfectivo: 0,
      montoTarjeta: 0,
      montoTransferencia: 0,
      incluyeEfectivo: true,
      cambioEfectivoOk: true,
    };

    it('omite si soloLectura o no puede cobrar', () => {
      expect(validarPrecondicionesCobro({ ...baseOk, soloLectura: true }).ok).toBeFalse();
      expect(validarPrecondicionesCobro({ ...baseOk, puedeCobrar: false })).toEqual(
        jasmine.objectContaining({ ok: false, skipped: true })
      );
    });

    it('alerta sin líneas', () => {
      const r = validarPrecondicionesCobro({ ...baseOk, lineasCount: 0 });
      expect(r.ok).toBeFalse();
      if (r.ok === false) {
        expect(r.alert?.title).toBe('Sin líneas');
      }
    });

    it('alerta monto inválido y marca touched', () => {
      const r = validarPrecondicionesCobro({ ...baseOk, monto: 0 });
      expect(r.ok).toBeFalse();
      if (r.ok === false) {
        expect(r.markCobroTouched).toBeTrue();
        expect(r.alert?.title).toBe('Monto');
      }
    });

    it('alerta efectivo insuficiente', () => {
      const r = validarPrecondicionesCobro({
        ...baseOk,
        cambioEfectivoOk: false,
        cambioEfectivoError: 'El efectivo recibido no cubre el monto a cobrar.',
      });
      expect(r.ok).toBeFalse();
      if (r.ok === false) {
        expect(r.alert?.title).toBe('Efectivo');
        expect(r.alert?.text).toContain('no cubre');
      }
    });

    it('acepta pago simple y mixto parcial', () => {
      const simple = validarPrecondicionesCobro(baseOk);
      expect(simple.ok).toBeTrue();
      if (simple.ok === true) {
        expect(simple.montoPago).toBe(100);
        expect(simple.partes).toEqual([{ metodo: 'efectivo', monto: 100 }]);
      }
      const mixto = validarPrecondicionesCobro({
        ...baseOk,
        mixto: true,
        monto: 0,
        montoEfectivo: 40,
        montoTarjeta: 10,
        incluyeEfectivo: true,
      });
      expect(mixto.ok).toBeTrue();
      if (mixto.ok === true) {
        expect(mixto.montoPago).toBe(50);
        expect(mixto.partes.length).toBe(2);
      }
    });
  });

  describe('mensajes y estado post-cobro', () => {
    it('toast parcial vs completo', () => {
      expect(mensajeToastCobro(true).title).toBe('Pago parcial registrado');
      expect(mensajeToastCobro(false).title).toBe('Venta cobrada');
      expect(mensajeToastCobro(false).text).toContain('WhatsApp');
    });

    it('esPagoParcial respeta epsilon', () => {
      expect(esPagoParcial(50, 100)).toBeTrue();
      expect(esPagoParcial(100, 100)).toBeFalse();
      expect(esPagoParcial(99.9995, 100)).toBeFalse();
    });

    it('construirEstadoPostCobro cierra ticket si pago completo', () => {
      const e = construirEstadoPostCobro({
        visitaId: 'v1',
        folio: 'KV-20261001-001',
        saldoAntes: 100,
        montoPago: 100,
        partes: [{ metodo: 'efectivo', monto: 100 }],
        pagadoAcc: 100,
        incluyeEfectivo: true,
        recibidoEfectivo: 120,
        montoEfectivoCobro: 100,
        cambioEfectivo: 20,
        telefonoCliente: '5512345678',
      });
      expect(e.esParcial).toBeFalse();
      expect(e.soloLectura).toBeTrue();
      expect(e.deshabilitarForms).toBeTrue();
      expect(e.patchCobroParcial).toBeNull();
      expect(e.pasoWizard).toBe(3);
      expect(e.ultimoRecibido).toBe(120);
      expect(e.ultimoCambio).toBe(20);
      expect(e.resultadoCobro).toEqual({ visitaId: 'v1', cobrado: true, parcial: false });
    });

    it('construirEstadoPostCobro deja patch si parcial', () => {
      const e = construirEstadoPostCobro({
        visitaId: 'v2',
        folio: '',
        saldoAntes: 100,
        montoPago: 40,
        partes: [{ metodo: 'tarjeta', monto: 40 }],
        pagadoAcc: 40,
        incluyeEfectivo: false,
        recibidoEfectivo: null,
        montoEfectivoCobro: 0,
        cambioEfectivo: 0,
        telefonoCliente: '',
      });
      expect(e.esParcial).toBeTrue();
      expect(e.soloLectura).toBeFalse();
      expect(e.patchCobroParcial).toEqual({ monto: 60, mixto: false });
      expect(e.ultimoRecibido).toBeNull();
      expect(e.ultimoPago.saldoPendiente).toBe(60);
    });
  });

  describe('ejecutarFlujoGuardar / ejecutarFlujoCobro', () => {
    it('guardar solo persiste', async () => {
      const r = await ejecutarFlujoGuardar({ persistir: async () => 'vid-g' });
      expect(r).toEqual({ visitaId: 'vid-g' });
    });

    it('cobro: orden persistir → caja → actualizar → folio (mostrador sin clienteId)', async () => {
      const calls: string[] = [];
      const movs: Array<{ concepto: string; clienteId?: string; monto: number }> = [];
      const r = await ejecutarFlujoCobro(
        {
          partes: [
            { metodo: 'efectivo', monto: 60 },
            { metodo: 'tarjeta', monto: 40 },
          ],
          montoPago: 100,
          saldoAntes: 100,
          lineas: [{ categoria: 'venta_producto', movimientoInventarioId: 'inv1' }],
          fecha: '2026-10-01',
          cliente: '',
          clienteId: '__mostrador__',
          modoMostrador: true,
        },
        {
          persistir: async () => {
            calls.push('persistir');
            return 'v-new';
          },
          getVisita: async (id) => {
            calls.push(`get:${id}`);
            return { cajaMovimientoIds: [], pagado: 0 };
          },
          crearMovimiento: async (data) => {
            calls.push(`mov:${data.metodoPago}`);
            movs.push({ concepto: data.concepto, clienteId: data.clienteId, monto: data.monto });
            return `m-${data.metodoPago}`;
          },
          actualizarVisita: async (id, patch) => {
            calls.push(`upd:${id}:${patch.pagado}:${patch.cajaMovimientoIds.join(',')}`);
          },
          asignarFolioSiFalta: async (id) => {
            calls.push(`folio:${id}`);
            return 'KV-TEST-1';
          },
        }
      );
      expect(calls).toEqual([
        'persistir',
        'get:v-new',
        'mov:efectivo',
        'mov:tarjeta',
        'upd:v-new:100:m-efectivo,m-tarjeta',
        'folio:v-new',
      ]);
      expect(movs.every((m) => m.clienteId === undefined)).toBeTrue();
      expect(movs[0].concepto).toContain('Mostrador');
      expect(r.folio).toBe('KV-TEST-1');
      expect(r.pagadoAcc).toBe(100);
    });

    it('cobro: falla si visita desaparece tras persistir', async () => {
      await expectAsync(
        ejecutarFlujoCobro(
          {
            partes: [{ metodo: 'efectivo', monto: 10 }],
            montoPago: 10,
            saldoAntes: 10,
            lineas: [{ categoria: 'consulta' }],
            fecha: '2026-10-01',
            cliente: 'Ana',
            clienteId: 'c1',
            modoMostrador: false,
          },
          {
            persistir: async () => 'gone',
            getVisita: async () => null,
            crearMovimiento: async () => 'x',
            actualizarVisita: async () => undefined,
            asignarFolioSiFalta: async () => '',
          }
        )
      ).toBeRejectedWithError('Visita no encontrada');
    });

    it('cobro: acumula pagado previo y no duplica mov ids', async () => {
      const r = await ejecutarFlujoCobro(
        {
          partes: [{ metodo: 'transferencia', monto: 30 }],
          montoPago: 30,
          saldoAntes: 50,
          lineas: [{ categoria: 'consulta' }, { categoria: 'venta_producto' }],
          fecha: '2026-10-01',
          cliente: 'Luis',
          clienteId: 'cli-1',
          modoMostrador: false,
        },
        {
          persistir: async () => 'v-ex',
          getVisita: async () => ({ cajaMovimientoIds: ['m-old'], pagado: 20 }),
          crearMovimiento: async () => 'm-old',
          actualizarVisita: async (_id, patch) => {
            expect(patch.pagado).toBe(50);
            expect(patch.cajaMovimientoIds).toEqual(['m-old']);
          },
          asignarFolioSiFalta: async () => 'F1',
        }
      );
      expect(r.pagadoAcc).toBe(50);
      expect(r.saldoAntes).toBe(50);
    });
  });

  it('contextos de error UI estables', () => {
    expect(CTX_ERROR_GUARDAR_VISITA).toBe('guardar visita');
    expect(CTX_ERROR_COBRAR_VISITA).toBe('cobrar visita');
  });
});
