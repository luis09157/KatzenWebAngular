import {
  etiquetaServiciosBanio,
  ordenarServiciosBanio,
  etiquetaTipoServicioBanioNuevo,
  leyendaCobroBanio,
  opcionesTipoServicioAlta,
  opcionesTipoServicioBanio,
  tipoServicioPerteneceAlModo,
} from './banio-tipos-servicio.util';

describe('banio-tipos-servicio.util (spec 085)', () => {
  it('Rápido ofrece corte de uñas, rasurado higiénico, baño medicado y cepillado', () => {
    expect(opcionesTipoServicioBanio(true).map((opcion) => opcion.label)).toEqual([
      'Corte de Uñas',
      'Rasurado higiénico',
      'Baño medicado',
      'Cepillado',
    ]);
  });

  it('Completo ofrece baño con corte, baño, baño con deslanado y baño con cepillado', () => {
    expect(opcionesTipoServicioBanio(false).map((opcion) => opcion.label)).toEqual([
      'Baño con corte',
      'Baño',
      'Baño con deslanado',
      'Baño con cepillado',
    ]);
  });

  it('un tipo de un modo no pertenece al otro', () => {
    expect(tipoServicioPerteneceAlModo('corte_uñas', true)).toBeTrue();
    expect(tipoServicioPerteneceAlModo('corte_uñas', false)).toBeFalse();
    expect(tipoServicioPerteneceAlModo('baño', false)).toBeTrue();
    expect(tipoServicioPerteneceAlModo('baño', true)).toBeFalse();
    expect(tipoServicioPerteneceAlModo('baño_básico', true)).toBeFalse();
    expect(tipoServicioPerteneceAlModo('baño_básico', false)).toBeFalse();
  });

  it('al editar un baño viejo, el tipo guardado se suma y no reemplaza las 3 opciones', () => {
    const opciones = opcionesTipoServicioBanio(false, 'corte_pelo');
    expect(opciones.map((opcion) => opcion.value)).toEqual([
      'baño_con_corte',
      'baño',
      'baño_con_deslanado',
      'baño_con_cepillado',
      'corte_pelo',
    ]);
    expect(opciones[4].label).toBe('Corte de Pelo');
  });

  it('si el tipo ya está en el modo, no se duplica', () => {
    expect(opcionesTipoServicioBanio(true, 'corte_uñas')).toHaveSize(4);
  });

  it('la etiqueta de listado solo cubre tipos nuevos', () => {
    expect(etiquetaTipoServicioBanioNuevo('rasurado_higienico')).toBe('Rasurado higiénico');
    expect(etiquetaTipoServicioBanioNuevo('baño_con_cepillado')).toBe('Baño con cepillado');
    expect(etiquetaTipoServicioBanioNuevo('baño_básico')).toBeNull();
    expect(etiquetaTipoServicioBanioNuevo('corte_uñas')).toBeNull();
  });

  it('el alta muestra los ocho servicios juntos', () => {
    expect(opcionesTipoServicioAlta().map((opcion) => opcion.label)).toEqual([
      'Corte de Uñas',
      'Rasurado higiénico',
      'Baño medicado',
      'Cepillado',
      'Baño con corte',
      'Baño',
      'Baño con deslanado',
      'Baño con cepillado',
    ]);
  });

  it('al editar un tipo viejo, se suma al final de los ocho', () => {
    const opciones = opcionesTipoServicioAlta('corte_pelo');
    expect(opciones).toHaveSize(9);
    expect(opciones[8].label).toBe('Corte de Pelo');
  });

  it('la leyenda de cobro distingue falta de precio, por cobrar y pagado', () => {
    expect(leyendaCobroBanio({ precio_total: 0, pagado: false })).toBe('falta_precio');
    expect(leyendaCobroBanio({ precio_total: null, pagado: true })).toBe('falta_precio');
    expect(leyendaCobroBanio({ precio_total: 80, pagado: false })).toBe('por_cobrar');
    expect(leyendaCobroBanio({ precio_total: 80, pagado: true })).toBe('pagado');
  });

  it('etiqueta con varios servicios: «Baño + Corte de Uñas»', () => {
    expect(
      etiquetaServiciosBanio({ tipo_servicio: 'baño', servicios_adicionales: [{ servicio: 'corte_uñas', precio: 0 }] })
    ).toBe('Baño + Corte de Uñas');
    expect(etiquetaServiciosBanio({ tipo_servicio: 'baño', servicios_adicionales: [] })).toBe('');
    expect(
      etiquetaServiciosBanio({ tipo_servicio: 'baño', servicios_adicionales: [{ servicio: 'otro', servicioPersonalizado: 'Perfume' }] })
    ).toBe('Baño + Perfume');
  });

  it('el baño completo queda primero aunque se toque después', () => {
    expect(ordenarServiciosBanio(['corte_uñas', 'baño', 'corte_uñas'])).toEqual(['baño', 'corte_uñas']);
    expect(ordenarServiciosBanio(['rasurado_higienico'])).toEqual(['rasurado_higienico']);
  });
});
