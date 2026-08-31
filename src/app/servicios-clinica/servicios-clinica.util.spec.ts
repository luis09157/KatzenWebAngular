import {
  MOCK_SERVICIO_CLINICA_CONSULTA,
  MOCK_SERVICIO_CLINICA_DIAGNOSTICO,
  MOCK_SERVICIO_CLINICA_DOMICILIO,
  MOCK_SERVICIO_CLINICA_HONORARIOS,
  MOCK_SERVICIO_CLINICA_SIN_PRECIO,
  MOCK_SERVICIOS_CLINICA
} from '../core/testing/mock-data';
import {
  COPY_BANIO_EN_FINANZAS,
  COPY_PRECIO_SERVICIO,
  categoriaLineaDesdeTipoServicio,
  encontrarServicioConsulta,
  esTipoServicioClinica,
  filtrarServiciosClinica,
  hayServicioConsultaConPrecio,
  iconoTipoServicioClinica,
  normalizarTipoServicioClinica,
  precioVentaServicio,
  esDecisionPrecioServicio,
  resolverLineaServicioClinica,
  serviciosParaRielConsulta,
  validarFormularioServicioClinica
} from './servicios-clinica.util';

describe('servicios-clinica.util', () => {
  it('normaliza tipo y no trata baño como servicio de este catálogo', () => {
    expect(esTipoServicioClinica('consulta')).toBe(true);
    expect(esTipoServicioClinica('banio')).toBe(false);
    expect(normalizarTipoServicioClinica('banio')).toBe('otro');
    expect(COPY_BANIO_EN_FINANZAS).toContain('Finanzas');
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
      servicio: MOCK_SERVICIO_CLINICA_SIN_PRECIO
    });
  });

  it('domicilio y honorarios van a categoría otro; consulta/diagnóstico a consulta', () => {
    expect(categoriaLineaDesdeTipoServicio('consulta')).toBe('consulta');
    expect(categoriaLineaDesdeTipoServicio('diagnostico')).toBe('consulta');
    expect(categoriaLineaDesdeTipoServicio(MOCK_SERVICIO_CLINICA_DOMICILIO.tipo)).toBe(
      'otro'
    );
    expect(categoriaLineaDesdeTipoServicio(MOCK_SERVICIO_CLINICA_HONORARIOS.tipo)).toBe(
      'otro'
    );
  });

  it('riel Consulta lista consulta, ultrasonido, domicilio y honorarios', () => {
    const ids = serviciosParaRielConsulta(MOCK_SERVICIOS_CLINICA).map((s) => s.id);
    expect(ids).toContain('svc-consulta-001');
    expect(ids).toContain('svc-usg-001');
    expect(ids).toContain('svc-dom-001');
    expect(ids).toContain('svc-hon-001');
    expect(ids).not.toContain('svc-consulta-inactiva');
    expect(encontrarServicioConsulta(MOCK_SERVICIOS_CLINICA)?.id).toBe('svc-consulta-001');
    expect(hayServicioConsultaConPrecio(MOCK_SERVICIOS_CLINICA)).toBe(true);
    expect(iconoTipoServicioClinica(MOCK_SERVICIO_CLINICA_DIAGNOSTICO.tipo)).toBe('biotech');
  });

  it('filtra por nombre o tipo', () => {
    expect(filtrarServiciosClinica(MOCK_SERVICIOS_CLINICA, 'ultrasonido').map((s) => s.id)).toEqual([
      'svc-usg-001'
    ]);
    expect(filtrarServiciosClinica(MOCK_SERVICIOS_CLINICA, 'domicilio').map((s) => s.id)).toEqual([
      'svc-dom-001'
    ]);
  });

  it('valida formulario: nombre, tipo y precio', () => {
    expect(
      validarFormularioServicioClinica({
        nombre: 'Consulta general',
        tipo: 'consulta',
        precio_venta: 400
      })
    ).toEqual({ ok: true });
    expect(validarFormularioServicioClinica({ nombre: 'A', tipo: 'consulta', precio_venta: 1 }).ok).toBe(
      false
    );
    expect(
      validarFormularioServicioClinica({ nombre: 'Honorarios', tipo: 'banio', precio_venta: 1 }).ok
    ).toBe(false);
    expect(
      validarFormularioServicioClinica({
        nombre: 'Consulta',
        tipo: 'consulta',
        precio_venta: -10
      }).ok
    ).toBe(false);
  });
});
