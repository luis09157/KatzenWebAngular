import {
  CONEJO_INTERVALO_DEFAULT_DIAS,
  CORE_MLV_ADULTO_DEFAULT_DIAS,
  EDAD_CIERRE_SERIE_SEM,
  FVRCP_REFUERZO_ALT_WSAVA_DIAS,
  FVRCP_REFUERZO_DEFAULT_DIAS,
  INTERVALO_SERIE_DEFAULT_DIAS,
  INTERVALO_TRIENAL_DIAS,
  LEPTO_INTERVALO_ADULTO_DIAS,
  MENSAJE_CONEJO_MANUAL,
  MENSAJE_SIN_ESQUEMA,
  NOTA_DISPONIBILIDAD_CONEJO_MX,
  RABIA_INTERVALO_DEFAULT_DIAS,
  TIPOS_CONEJO_OLA3,
  TIPOS_VACUNAS_FALLBACK,
  esComboCanino,
  fusionarTiposConejoEnCatalogo,
  semanticaDesdeValue
} from './esquema-vacuna.defaults';
import {
  addDaysLocal,
  contarRefuerzosClinicos,
  esIntervaloCortoCore,
  inferirEtapaPaciente,
  neverSuggestsSevenDayCore,
  normalizarEspecie,
  parseEdadASemanas,
  resolverIntervaloConfirmacion,
  sugerirEsquema
} from './esquema-vacuna.util';
import { dayKeyLocal } from './vacuna-recordatorio.util';

describe('esquema-vacuna.util (052 ola 1+3)', () => {
  const fecha = '2026-08-01';

  it('normaliza especies incluyendo conejo, hurón y aliases', () => {
    expect(normalizarEspecie('CANINO')).toBe('CANINO');
    expect(normalizarEspecie('perro')).toBe('CANINO');
    expect(normalizarEspecie('Gato')).toBe('FELINO');
    expect(normalizarEspecie('conejo')).toBe('CONEJO');
    expect(normalizarEspecie('lagomorfo')).toBe('CONEJO');
    expect(normalizarEspecie('HURON')).toBe('HURON');
    expect(normalizarEspecie('hurón')).toBe('HURON');
    expect(normalizarEspecie('ferret')).toBe('HURON');
    expect(normalizarEspecie('AVE')).toBe('AVE');
    expect(normalizarEspecie('iguana')).toBe('OTRO');
  });

  it('parsea edad en semanas, meses y años', () => {
    expect(parseEdadASemanas('8 semanas')).toBe(8);
    expect(parseEdadASemanas('2 meses')).toBe(9);
    expect(parseEdadASemanas('3 años')).toBe(156);
    expect(parseEdadASemanas('1 año')).toBe(52);
    expect(parseEdadASemanas(3)).toBe(156);
  });

  it('infiere cachorro vs adulto', () => {
    expect(inferirEtapaPaciente(8, null, 'quintuple')).toBe('cachorro');
    expect(inferirEtapaPaciente(156, null, 'quintuple')).toBe('adulto');
    expect(inferirEtapaPaciente(null, 'gatito', 'triple_felina')).toBe('cachorro');
    expect(inferirEtapaPaciente(null, null, 'puppy')).toBe('cachorro');
  });

  it('cachorro 8 sem + quíntuple: serie 21 días, nunca 7, hasta cierre 16 sem', () => {
    const s = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'quintuple',
      edadSemanas: 8,
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeTrue();
    expect(s.esquemaCodigo).toBe('core_mlv_canino');
    expect(s.intervaloSugeridoDias).toBe(INTERVALO_SERIE_DEFAULT_DIAS);
    expect(s.intervaloSugeridoDias).toBeGreaterThanOrEqual(14);
    expect(neverSuggestsSevenDayCore(s.intervaloSugeridoDias)).toBeTrue();
    expect(s.etapaEsquema).toBe('serie_inicio');
    expect(s.hints.some(h => h.key === 'mda')).toBeTrue();
    expect(s.hints.some(h => h.key === 'serie_3_dosis')).toBeTrue();
    expect(dayKeyLocal(s.proximaSugerida!)).toBe('2026-08-22');
    expect(8 + 21 / 7).toBeLessThan(EDAD_CIERRE_SERIE_SEM);
  });

  it('cachorro ≥16 sem + DHPP: cierre de serie y refuerzo 365, no 1095', () => {
    const s = sugerirEsquema({
      especie: 'perro',
      tipoVacuna: 'puppy',
      edadSemanas: 16,
      fechaAplicacion: fecha
    });
    expect(s.etapaEsquema).toBe('cierre_16sem');
    expect(s.intervaloSugeridoDias).toBe(CORE_MLV_ADULTO_DEFAULT_DIAS);
    expect(s.intervaloSugeridoDias).not.toBe(INTERVALO_TRIENAL_DIAS);
  });

  it('perro adulto core MLV: 365 editable, no 3 años por default', () => {
    const s = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'quintuple',
      edadTexto: '3 años',
      fechaAplicacion: fecha
    });
    expect(s.etapaEsquema).toBe('adulto');
    expect(s.intervaloSugeridoDias).toBe(365);
    expect(s.intervaloSugeridoDias).not.toBe(1095);
  });

  it('rabia MX: 365 y nunca 1095; hint NOM', () => {
    const s = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'antirrabica',
      edadTexto: '2 años',
      fechaAplicacion: fecha
    });
    expect(s.intervaloSugeridoDias).toBe(RABIA_INTERVALO_DEFAULT_DIAS);
    expect(s.intervaloSugeridoDias).not.toBe(INTERVALO_TRIENAL_DIAS);
    expect(s.nuncaTrienal).toBeTrue();
    expect(s.presetsIntervaloDias).not.toContain(1095);
    expect(s.hints.some(h => h.key === 'rabia_nom')).toBeTrue();
    expect(s.categoria).toBe('legal_mx');
  });

  it('rabia en cachorro <12 sem: hint etiqueta, intervalo sigue 365', () => {
    const s = sugerirEsquema({
      especie: 'FELINO',
      tipoVacuna: 'antirrabica',
      edadSemanas: 8,
      fechaAplicacion: fecha
    });
    expect(s.intervaloSugeridoDias).toBe(365);
    expect(s.hints.some(h => h.key === 'rabia_12sem')).toBeTrue();
  });

  it('lepto cachorro: 2ª dosis a 21 días; adulto anual; nunca trienal', () => {
    const serie = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'lepto',
      etapa: 'cachorro',
      fechaAplicacion: fecha
    });
    expect(serie.intervaloSugeridoDias).toBe(INTERVALO_SERIE_DEFAULT_DIAS);
    expect(serie.nuncaTrienal).toBeTrue();

    const adulto = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'lepto',
      edadTexto: '4 años',
      fechaAplicacion: fecha
    });
    expect(adulto.intervaloSugeridoDias).toBe(LEPTO_INTERVALO_ADULTO_DIAS);
    expect(adulto.intervaloSugeridoDias).not.toBe(1095);
  });

  it('séxtuple adulto hereda anual de lepto (no 1095 del core MLV)', () => {
    const s = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'sextuple',
      edadTexto: '5 años',
      fechaAplicacion: fecha
    });
    expect(s.intervaloSugeridoDias).toBe(365);
    expect(s.hints.some(h => h.key === 'lepto_combo')).toBeTrue();
    expect(s.nuncaTrienal).toBeTrue();
  });

  it('gato gatito FVRCP: serie 21 días; adulto 365 con preset 6 meses', () => {
    const gatito = sugerirEsquema({
      especie: 'FELINO',
      tipoVacuna: 'triple_felina',
      edadSemanas: 8,
      fechaAplicacion: fecha
    });
    expect(gatito.esquemaCodigo).toBe('core_fvrcp');
    expect(gatito.intervaloSugeridoDias).toBe(21);

    const adulto = sugerirEsquema({
      especie: 'gato',
      tipoVacuna: 'triple_felina',
      edadTexto: '2 años',
      fechaAplicacion: fecha
    });
    expect(adulto.intervaloSugeridoDias).toBe(FVRCP_REFUERZO_DEFAULT_DIAS);
    expect(adulto.presetsIntervaloDias).toContain(FVRCP_REFUERZO_ALT_WSAVA_DIAS);
    expect(adulto.presetsIntervaloDias).toContain(365);
  });

  it('FeLV <1 año: serie 21 + hint test; adulto indoor: no auto-esquema', () => {
    const joven = sugerirEsquema({
      especie: 'FELINO',
      tipoVacuna: 'leucemia_felina',
      edadSemanas: 20,
      fechaAplicacion: fecha
    });
    expect(joven.puedeSugerir).toBeTrue();
    expect(joven.intervaloSugeridoDias).toBe(21);
    expect(joven.hints.some(h => h.key === 'felv_test')).toBeTrue();

    const adulto = sugerirEsquema({
      especie: 'FELINO',
      tipoVacuna: 'leucemia_felina',
      edadTexto: '3 años',
      indoorAdulto: true
    });
    expect(adulto.puedeSugerir).toBeFalse();
    expect(adulto.intervaloSugeridoDias).toBeNull();
    expect(adulto.hints.some(h => h.key === 'felv_indoor')).toBeTrue();
  });

  it('giardia y CCoV: no sugerir esquema', () => {
    const g = sugerirEsquema({ especie: 'CANINO', tipoVacuna: 'giardia', edadTexto: '1 año' });
    expect(g.puedeSugerir).toBeFalse();
    expect(g.intervaloSugeridoDias).toBeNull();
    expect(g.hints.some(h => h.key === 'no_recomendada')).toBeTrue();

    const c = sugerirEsquema({ especie: 'CANINO', tipoVacuna: 'coronavirus' });
    expect(c.puedeSugerir).toBeFalse();
  });

  it('ave / reptil / otro: sin esquema sugerido (no hereda DHPP)', () => {
    const ave = sugerirEsquema({
      especie: 'AVE',
      tipoVacuna: 'quintuple',
      fechaAplicacion: fecha
    });
    expect(ave.puedeSugerir).toBeFalse();
    expect(ave.intervaloSugeridoDias).toBeNull();
    expect(ave.mensajeSinEsquema).toBe(MENSAJE_SIN_ESQUEMA);
    expect(ave.hints.some(h => h.key === 'sin_esquema_exotico')).toBeTrue();

    const reptil = sugerirEsquema({ especie: 'REPTIL', tipoVacuna: 'antirrabica' });
    expect(reptil.puedeSugerir).toBeFalse();
    expect(reptil.mensajeSinEsquema).toBe(MENSAJE_SIN_ESQUEMA);
  });

  it('conejo: intervalo manual, sin fingir kits EU ni serie de 21 días', () => {
    const s = sugerirEsquema({
      especie: 'CONEJO',
      tipoVacuna: 'mixomatosis',
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeFalse();
    expect(s.intervaloSugeridoDias).toBeNull();
    expect(s.intervaloSugeridoDias).not.toBe(INTERVALO_SERIE_DEFAULT_DIAS);
    expect(s.proximaSugerida).toBeNull();
    expect(s.esquemaCodigo).toBe('conejo_manual');
    expect(s.mensajeSinEsquema).toBe(MENSAJE_CONEJO_MANUAL);
    expect(s.hints.some(h => h.key === 'conejo_mx')).toBeTrue();
    expect(s.hints.some(h => h.message.includes('VEHC-2'))).toBeTrue();
    expect(s.hints.some(h => /Nobivac PLUS|Filavac/i.test(h.message))).toBeTrue();
    expect(s.presetsIntervaloDias).toEqual([CONEJO_INTERVALO_DEFAULT_DIAS]);
  });

  it('conejo + quíntuple: tampoco hereda 21 días de perro', () => {
    const s = sugerirEsquema({
      especie: 'CONEJO',
      tipoVacuna: 'quintuple',
      edadSemanas: 8,
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeFalse();
    expect(s.intervaloSugeridoDias).toBeNull();
    expect(s.intervaloSugeridoDias).not.toBe(21);
  });

  it('catálogo fallback incluye mixomatosis, RHDV/RHDV2 y otra_conejo con nota MX', () => {
    const values = TIPOS_VACUNAS_FALLBACK.map(t => t.value);
    expect(values).toContain('mixomatosis');
    expect(values).toContain('rhdv_rhdv2');
    expect(values).toContain('otra_conejo');
    for (const tipo of TIPOS_CONEJO_OLA3) {
      expect(tipo.especies).toEqual(['CONEJO']);
      expect(tipo.disponibilidadNota).toBe(NOTA_DISPONIBILIDAD_CONEJO_MX);
    }
    expect(semanticaDesdeValue('mixomatosis').codigo).toBe('conejo_manual');
    expect(semanticaDesdeValue('rhdv_rhdv2').intervaloAdultoDias).toBe(365);
  });

  it('fusionarTiposConejoEnCatalogo no pisa legacy y añade los que faltan', () => {
    const legacy = [{ value: 'quintuple', label: 'Quíntuple' }, { value: 'mixomatosis', label: 'Ya existe' }];
    const fused = fusionarTiposConejoEnCatalogo(legacy);
    expect(fused.filter(t => t.value === 'mixomatosis').length).toBe(1);
    expect(fused.find(t => t.value === 'mixomatosis')?.label).toBe('Ya existe');
    expect(fused.some(t => t.value === 'rhdv_rhdv2')).toBeTrue();
    expect(fused.some(t => t.value === 'otra_conejo')).toBeTrue();
    expect(fused.some(t => t.value === 'quintuple')).toBeTrue();
  });

  it('hurón + combo canino: hint AFA, sin esquema', () => {
    const s = sugerirEsquema({
      especie: 'HURON',
      tipoVacuna: 'quintuple',
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeFalse();
    expect(s.intervaloSugeridoDias).toBeNull();
    expect(s.mensajeSinEsquema).toBe(MENSAJE_SIN_ESQUEMA);
    expect(s.hints.some(h => h.key === 'huron_combo')).toBeTrue();
    expect(esComboCanino('sextuple')).toBeTrue();
    expect(esComboCanino('mixomatosis')).toBeFalse();
  });

  it('hurón + rabia: anual 365, hint etiqueta MX', () => {
    const s = sugerirEsquema({
      especie: 'ferret',
      tipoVacuna: 'antirrabica',
      edadTexto: '2 años',
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeTrue();
    expect(s.intervaloSugeridoDias).toBe(RABIA_INTERVALO_DEFAULT_DIAS);
    expect(s.intervaloSugeridoDias).not.toBe(1095);
    expect(s.hints.some(h => h.key === 'huron_rabia')).toBeTrue();
  });

  it('hurón + otra: sin esquema sugerido', () => {
    const s = sugerirEsquema({ especie: 'HURON', tipoVacuna: 'otra' });
    expect(s.puedeSugerir).toBeFalse();
    expect(s.hints.some(h => h.key === 'huron_sin_esquema')).toBeTrue();
  });

  it('confirmación conejo: no propone 21 días residuales de perro', () => {
    expect(
      resolverIntervaloConfirmacion({
        especie: 'CONEJO',
        intervaloActual: 21,
        intervaloSugeridoDias: null,
        puedeSugerir: false
      })
    ).toBeNull();
    expect(
      resolverIntervaloConfirmacion({
        especie: 'CONEJO',
        intervaloActual: 365,
        puedeSugerir: false
      })
    ).toBe(365);
    expect(
      resolverIntervaloConfirmacion({
        especie: 'CANINO',
        intervaloActual: 21,
        puedeSugerir: true
      })
    ).toBe(21);
  });

  it('Fallecido: no sugerir recordatorio', () => {
    const s = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'antirrabica',
      estadoPaciente: 'Fallecido',
      fechaAplicacion: fecha
    });
    expect(s.puedeSugerir).toBeFalse();
    expect(s.hints.some(h => h.key === 'fallecido')).toBeTrue();
  });

  it('intervalo <14 días en core MLV: soft-warn', () => {
    const sem = semanticaDesdeValue('quintuple');
    expect(esIntervaloCortoCore(7, sem)).toBeTrue();
    expect(esIntervaloCortoCore(21, sem)).toBeFalse();
    expect(esIntervaloCortoCore(7, semanticaDesdeValue('antirrabica'))).toBeFalse();
  });

  it('nunca sugiere 7 días en core cachorro', () => {
    const s = sugerirEsquema({
      especie: 'CANINO',
      tipoVacuna: 'quintuple',
      etapa: 'cachorro'
    });
    expect(s.intervaloSugeridoDias).not.toBe(7);
    expect(s.intervaloSugeridoDias).toBe(21);
  });

  it('addDaysLocal no usa 7 días como default de serie', () => {
    const prox = addDaysLocal(new Date(2026, 7, 1), 21);
    expect(dayKeyLocal(prox)).toBe('2026-08-22');
  });

  it('KPI refuerzos: esta semana y vencidas', () => {
    const lunes = new Date(2026, 7, 24); // lun 24 ago 2026
    const stats = contarRefuerzosClinicos(
      [
        { proximaAplicacion: '2026-08-26' },
        { proximaAplicacion: '2026-08-20' },
        { proximaAplicacion: '2026-09-10' },
        { proximaAplicacion: '2026-08-25', activo: false }
      ],
      lunes
    );
    expect(stats.estaSemana).toBe(1);
    expect(stats.vencidas).toBe(1);
  });
});
