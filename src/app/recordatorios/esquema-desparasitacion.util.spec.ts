import { sugerirEsquemaDesparasitacion } from './esquema-desparasitacion.util';

describe('sugerirEsquemaDesparasitacion (053)', () => {
  const fecha = new Date(2026, 7, 28, 9, 0, 0);

  it('cachorro canino <12 sem → 14 días', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'CANINO',
      edadTexto: '8 semanas',
      tipo: 'interna',
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeTrue();
    expect(s.esquemaCodigo).toBe('cachorro_serie_14');
    expect(s.intervaloSugeridoDias).toBe(14);
    expect(s.proximaSugerida?.getDate()).toBe(11);
  });

  it('adulto canino interna → 90 días', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'perro',
      edadTexto: '3',
      tipo: 'interna',
      fechaAplicacion: fecha
    });
    expect(s.esquemaCodigo).toBe('adulto_interna_90');
    expect(s.intervaloSugeridoDias).toBe(90);
  });

  it('adulto felino externa → 30 días', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'FELINO',
      edadTexto: '2 años',
      tipo: 'externa',
      fechaAplicacion: fecha
    });
    expect(s.esquemaCodigo).toBe('adulto_externa_30');
    expect(s.intervaloSugeridoDias).toBe(30);
  });

  it('ambas en adulto sugiere 30 + hint', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'CANINO',
      edadTexto: '4 años',
      tipo: 'ambas',
      fechaAplicacion: fecha
    });
    expect(s.esquemaCodigo).toBe('adulto_ambas_30');
    expect(s.intervaloSugeridoDias).toBe(30);
    expect(s.hints.some(h => h.key === 'ambas')).toBeTrue();
  });

  it('juvenil 12–24 sem → 30 días', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'gato',
      edadTexto: '4 meses',
      tipo: 'interna',
      fechaAplicacion: fecha
    });
    expect(s.esquemaCodigo).toBe('juvenil_30');
    expect(s.intervaloSugeridoDias).toBe(30);
  });

  it('ave/reptil sin esquema', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'AVE',
      tipo: 'interna',
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeFalse();
    expect(s.esquemaCodigo).toBe('sin_esquema');
    expect(s.intervaloSugeridoDias).toBeNull();
  });

  it('conejo: manual con default 90', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'CONEJO',
      tipo: 'interna',
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeFalse();
    expect(s.esquemaCodigo).toBe('exotico_manual');
    expect(s.intervaloSugeridoDias).toBe(90);
  });

  it('fallecido no propone próxima', () => {
    const s = sugerirEsquemaDesparasitacion({
      especie: 'CANINO',
      edadTexto: '2',
      tipo: 'interna',
      fechaAplicacion: fecha,
      estadoPaciente: 'Fallecido'
    });
    expect(s.proximaSugerida).toBeNull();
    expect(s.hints.some(h => h.key === 'fallecido')).toBeTrue();
  });
});
