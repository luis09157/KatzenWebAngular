import {
  MOCK_SERVICIO_CLINICA_CONSULTA,
  MOCK_SERVICIO_CLINICA_CONSULTA_DOMICILIO,
  MOCK_SERVICIO_CLINICA_DIAGNOSTICO,
  MOCK_SERVICIO_CLINICA_DOMICILIO,
  MOCK_SERVICIO_CLINICA_DOMICILIO_LEGACY_RAW,
  MOCK_SERVICIO_CLINICA_HONORARIOS,
  MOCK_SERVICIO_CLINICA_PROCEDIMIENTO,
  MOCK_SERVICIO_CLINICA_SIN_PRECIO,
  MOCK_SERVICIOS_CLINICA,
} from '../core/testing/mock-data';
import {
  COPY_BANIO_EN_FINANZAS,
  COPY_PRECIO_SERVICIO,
  categoriaLineaDesdeServicioClinica,
  categoriaLineaDesdeTipoServicio,
  contarKpisServiciosClinica,
  encontrarServicioConsulta,
  esServicioDomicilio,
  esTipoServicioClinica,
  filtrarServiciosClinica,
  hayServicioConsultaConPrecio,
  hidratarServicioClinica,
  iconoTipoServicioClinica,
  labelTipoClinicoParaReporte,
  normalizarTipoServicioClinica,
  planMigracionServiciosClinicaDomicilio,
  planPatchMigracionDomicilio,
  precioVentaServicio,
  esDecisionPrecioServicio,
  resolverLineaServicioClinica,
  serviciosParaRielConsulta,
  tipoEfectivoServicioClinica,
  validarFormularioServicioClinica,
} from './servicios-clinica.util';

describe('servicios-clinica.util', () => {
  it('normaliza tipo UI y no trata baño como servicio de este catálogo', () => {
    expect(esTipoServicioClinica('consulta')).toBe(true);
    expect(esTipoServicioClinica('procedimiento')).toBe(true);
    expect(esTipoServicioClinica('domicilio')).toBe(false);
    expect(esTipoServicioClinica('banio')).toBe(false);
    expect(normalizarTipoServicioClinica('banio')).toBe('otro');
    expect(normalizarTipoServicioClinica('domicilio')).toBe('consulta');
    expect(COPY_BANIO_EN_FINANZAS).toContain('Finanzas');
  });

  it('legacy tipo domicilio → esDomicilio + tipo efectivo consulta', () => {
    expect(esServicioDomicilio(MOCK_SERVICIO_CLINICA_DOMICILIO_LEGACY_RAW)).toBe(true);
    expect(tipoEfectivoServicioClinica(MOCK_SERVICIO_CLINICA_DOMICILIO_LEGACY_RAW)).toBe('consulta');
    const h = hidratarServicioClinica(MOCK_SERVICIO_CLINICA_DOMICILIO_LEGACY_RAW, 'svc-dom-001');
    expect(h.tipo).toBe('consulta');
    expect(h.esDomicilio).toBe(true);
    expect(esServicioDomicilio(MOCK_SERVICIO_CLINICA_DOMICILIO)).toBe(true);
    expect(esServicioDomicilio(MOCK_SERVICIO_CLINICA_CONSULTA_DOMICILIO)).toBe(true);
    expect(esServicioDomicilio(MOCK_SERVICIO_CLINICA_CONSULTA)).toBe(false);
  });

  it('servicio con precio arma línea sin prompt', () => {
    const d = resolverLineaServicioClinica(MOCK_SERVICIO_CLINICA_CONSULTA);
    expect(esDecisionPrecioServicio(d)).toBe(true);
    if (!esDecisionPrecioServicio(d)) {
      fail('debía resolver precio de catálogo');
      return;
    }
    expect(d.monto).toBe(400);
    expect(d.servicio.id).toBe('svc-consulta-001');
    expect(COPY_PRECIO_SERVICIO).toBe('Precio de servicio');
  });

  it('sin precio_venta pide monto (fallback)', () => {
    expect(precioVentaServicio(MOCK_SERVICIO_CLINICA_SIN_PRECIO)).toBeNull();
    expect(resolverLineaServicioClinica(MOCK_SERVICIO_CLINICA_SIN_PRECIO)).toEqual({
      pedirMonto: true,
      motivo: 'sin_precio',
      servicio: MOCK_SERVICIO_CLINICA_SIN_PRECIO,
    });
  });

  it('mapea categoría línea: procedimiento→cirugia; legacy domicilio ya no fuerza otro', () => {
    expect(categoriaLineaDesdeTipoServicio('consulta')).toBe('consulta');
    // Fase 2: diagnóstico sigue en bucket caja `consulta` (sin categoría nueva P&L).
    expect(categoriaLineaDesdeTipoServicio('diagnostico')).toBe('consulta');
    expect(categoriaLineaDesdeTipoServicio('procedimiento')).toBe('cirugia');
    expect(categoriaLineaDesdeTipoServicio('otro')).toBe('otro');
    expect(categoriaLineaDesdeTipoServicio('domicilio')).toBe('consulta');
    expect(categoriaLineaDesdeServicioClinica(MOCK_SERVICIO_CLINICA_DOMICILIO)).toBe('consulta');
    expect(categoriaLineaDesdeServicioClinica(MOCK_SERVICIO_CLINICA_PROCEDIMIENTO)).toBe('cirugia');
    expect(categoriaLineaDesdeServicioClinica(MOCK_SERVICIO_CLINICA_HONORARIOS)).toBe('otro');
    expect(labelTipoClinicoParaReporte('diagnostico')).toBe('Diagnóstico');
    expect(labelTipoClinicoParaReporte('consulta')).toBe('Consulta');
  });

  it('KPIs alinean tipos clínicos y domicilio por flag/legacy (no cuenta domicilio como tipo)', () => {
    const kpis = contarKpisServiciosClinica(MOCK_SERVICIOS_CLINICA);
    expect(kpis.activos).toBeGreaterThan(0);
    expect(kpis.consultas).toBeGreaterThanOrEqual(1);
    expect(kpis.diagnosticos).toBeGreaterThanOrEqual(1);
    expect(kpis.procedimientos).toBeGreaterThanOrEqual(1);
    expect(kpis.aDomicilio).toBeGreaterThanOrEqual(2);
    // Legacy hidratado cuenta como consulta + aDomicilio, no como quinto tipo.
    const legacy = hidratarServicioClinica(MOCK_SERVICIO_CLINICA_DOMICILIO_LEGACY_RAW, 'x');
    const soloLegacy = contarKpisServiciosClinica([legacy]);
    expect(soloLegacy.consultas).toBe(1);
    expect(soloLegacy.aDomicilio).toBe(1);
    expect(soloLegacy.diagnosticos).toBe(0);
  });

  it('SC-008 plan migración: tipo domicilio → consulta + esDomicilio; idempotente', () => {
    const now = '2026-10-04T12:00:00.000Z';
    const plan = planPatchMigracionDomicilio(MOCK_SERVICIO_CLINICA_DOMICILIO_LEGACY_RAW, { now });
    expect(plan.needsMigration).toBe(true);
    if (!plan.needsMigration) return;
    expect(plan.patch).toEqual({
      tipo: 'consulta',
      esDomicilio: true,
      updated_at: now,
    });

    expect(planPatchMigracionDomicilio(MOCK_SERVICIO_CLINICA_CONSULTA).needsMigration).toBe(false);
    expect(planPatchMigracionDomicilio(MOCK_SERVICIO_CLINICA_CONSULTA_DOMICILIO).needsMigration).toBe(false);
    expect(planPatchMigracionDomicilio(null).needsMigration).toBe(false);

    const batch = planMigracionServiciosClinicaDomicilio(
      {
        a: MOCK_SERVICIO_CLINICA_DOMICILIO_LEGACY_RAW,
        b: MOCK_SERVICIO_CLINICA_CONSULTA,
        c: MOCK_SERVICIO_CLINICA_CONSULTA_DOMICILIO,
      },
      { now }
    );
    expect(batch.total).toBe(3);
    expect(batch.aMigrar).toBe(1);
    expect(batch.yaOk).toBe(2);
    expect(batch.items[0].id).toBe('a');
    expect(batch.items[0].patch.tipo).toBe('consulta');
    expect(batch.items[0].patch.esDomicilio).toBe(true);
  });

  it('riel Consulta lista catálogo activo (sin riel domicilio)', () => {
    const ids = serviciosParaRielConsulta(MOCK_SERVICIOS_CLINICA).map((s) => s.id);
    expect(ids).toContain('svc-consulta-001');
    expect(ids).toContain('svc-usg-001');
    expect(ids).toContain('svc-dom-001');
    expect(ids).toContain('svc-consulta-dom-001');
    expect(ids).toContain('svc-proc-001');
    expect(ids).toContain('svc-hon-001');
    expect(ids).not.toContain('svc-consulta-inactiva');
    expect(encontrarServicioConsulta(MOCK_SERVICIOS_CLINICA)?.id).toBe('svc-consulta-001');
    expect(hayServicioConsultaConPrecio(MOCK_SERVICIOS_CLINICA)).toBe(true);
    expect(iconoTipoServicioClinica(MOCK_SERVICIO_CLINICA_DIAGNOSTICO.tipo)).toBe('biotech');
    expect(iconoTipoServicioClinica('procedimiento')).toBe('healing');
  });

  it('filtra por nombre, tipo o modalidad domicilio', () => {
    expect(filtrarServiciosClinica(MOCK_SERVICIOS_CLINICA, 'ultrasonido').map((s) => s.id)).toEqual(['svc-usg-001']);
    const domIds = filtrarServiciosClinica(MOCK_SERVICIOS_CLINICA, 'domicilio').map((s) => s.id);
    expect(domIds).toContain('svc-dom-001');
    expect(domIds).toContain('svc-consulta-dom-001');
  });

  it('valida formulario: nombre, tipo UI y precio (rechaza domicilio como tipo)', () => {
    expect(
      validarFormularioServicioClinica({
        nombre: 'Consulta general',
        tipo: 'consulta',
        precio_venta: 400,
      })
    ).toEqual({ ok: true });
    expect(
      validarFormularioServicioClinica({
        nombre: 'Sutura',
        tipo: 'procedimiento',
        precio_venta: 900,
      })
    ).toEqual({ ok: true });
    expect(validarFormularioServicioClinica({ nombre: 'A', tipo: 'consulta', precio_venta: 1 }).ok).toBe(false);
    expect(validarFormularioServicioClinica({ nombre: 'Honorarios', tipo: 'banio', precio_venta: 1 }).ok).toBe(false);
    expect(
      validarFormularioServicioClinica({
        nombre: 'Visita',
        tipo: 'domicilio',
        precio_venta: 600,
      }).ok
    ).toBe(false);
    expect(
      validarFormularioServicioClinica({
        nombre: 'Consulta',
        tipo: 'consulta',
        precio_venta: -10,
      }).ok
    ).toBe(false);
    expect(
      validarFormularioServicioClinica({
        nombre: 'Consulta',
        tipo: 'consulta',
        precio_venta: 400,
        precio_costo: 400,
      }).ok
    ).toBe(false);
    expect(
      validarFormularioServicioClinica({
        nombre: 'Consulta',
        tipo: 'consulta',
        precio_venta: 400,
        precio_costo: 80,
      })
    ).toEqual({ ok: true });
  });
});
