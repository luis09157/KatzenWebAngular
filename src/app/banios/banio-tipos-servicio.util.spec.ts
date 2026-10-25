import {
  etiquetaTipoServicioBanioNuevo,
  leyendaCobroBanio,
  opcionesTipoServicioAlta,
  opcionesTipoServicioBanio,
  tipoServicioPerteneceAlModo,
} from './banio-tipos-servicio.util';

describe('banio-tipos-servicio.util (spec 085)', () => {
  it('Rápido ofrece solo corte de uñas, rasurado higiénico y baño medicado', () => {
    expect(opcionesTipoServicioBanio(true).map((opcion) => opcion.label)).toEqual([
      'Corte de Uñas',
      'Rasurado higiénico',
      'Baño medicado',
    ]);
  });

  it('Completo ofrece solo baño con corte, baño y baño con deslanado', () => {
    expect(opcionesTipoServicioBanio(false).map((opcion) => opcion.label)).toEqual([
      'Baño con corte',
      'Baño',
      'Baño con deslanado',
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
      'corte_pelo',
    ]);
    expect(opciones[3].label).toBe('Corte de Pelo');
  });

  it('si el tipo ya está en el modo, no se duplica', () => {
    expect(opcionesTipoServicioBanio(true, 'corte_uñas')).toHaveSize(3);
  });

  it('la etiqueta de listado solo cubre tipos nuevos', () => {
    expect(etiquetaTipoServicioBanioNuevo('rasurado_higienico')).toBe('Rasurado higiénico');
    expect(etiquetaTipoServicioBanioNuevo('baño_básico')).toBeNull();
    expect(etiquetaTipoServicioBanioNuevo('corte_uñas')).toBeNull();
  });

  it('el alta muestra los seis servicios juntos', () => {
    expect(opcionesTipoServicioAlta().map((opcion) => opcion.label)).toEqual([
      'Corte de Uñas',
      'Rasurado higiénico',
      'Baño medicado',
      'Baño con corte',
      'Baño',
      'Baño con deslanado',
    ]);
  });

  it('al editar un tipo viejo, se suma al final de los seis', () => {
    const opciones = opcionesTipoServicioAlta('corte_pelo');
    expect(opciones).toHaveSize(7);
    expect(opciones[6].label).toBe('Corte de Pelo');
  });

  it('la leyenda de cobro distingue falta de precio, por cobrar y pagado', () => {
    expect(leyendaCobroBanio({ precio_total: 0, pagado: false })).toBe('falta_precio');
    expect(leyendaCobroBanio({ precio_total: null, pagado: true })).toBe('falta_precio');
    expect(leyendaCobroBanio({ precio_total: 80, pagado: false })).toBe('por_cobrar');
    expect(leyendaCobroBanio({ precio_total: 80, pagado: true })).toBe('pagado');
  });
});
