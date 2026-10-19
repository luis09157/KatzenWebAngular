import { CONSENTIMIENTO_TIPOS } from './consentimientos.models';
import {
  CONSENTIMIENTO_CUERPO_MAX_CHARS,
  CONSENTIMIENTO_CUERPO_MAX_WORDS,
  CONSENTIMIENTO_DISCLAIMER,
  CONSENTIMIENTO_PLACEHOLDERS,
  contarPalabrasCuerpoConsentimiento,
  getPlantillaConsentimiento,
  listarPlantillasConsentimiento,
  reemplazarPlaceholdersConsentimiento,
} from './consentimiento-plantillas.util';
import { buildConsentimientoDocumentoView, nombreArchivoPdfConsentimiento } from './consentimiento-documento.util';
import { htmlConsentimientoATextoPlano } from './consentimiento-pdf.util';

describe('consentimiento-plantillas (094)', () => {
  it('cubre los 7 tipos con título y cuerpo sustancial', () => {
    expect(CONSENTIMIENTO_TIPOS.length).toBe(7);
    const list = listarPlantillasConsentimiento();
    expect(list.length).toBe(7);
    for (const tipo of CONSENTIMIENTO_TIPOS) {
      const p = getPlantillaConsentimiento(tipo);
      expect(p.tipo).toBe(tipo);
      expect(p.titulo.length).toBeGreaterThan(10);
      expect(p.cuerpo.length).toBeGreaterThan(200);
      expect(p.cuerpo).toContain('{{clinica}}');
      expect(p.cuerpo).toContain('{{paciente}}');
      expect(p.cuerpo).toContain(CONSENTIMIENTO_DISCLAIMER);
    }
  });

  it('mantiene cada tipo bajo umbral de longitud (1 hoja A4 ~10–11pt)', () => {
    for (const tipo of CONSENTIMIENTO_TIPOS) {
      const p = getPlantillaConsentimiento(tipo);
      expect(p.cuerpo.length)
        .withContext(`${tipo} chars=${p.cuerpo.length}`)
        .toBeLessThanOrEqual(CONSENTIMIENTO_CUERPO_MAX_CHARS);
      const words = contarPalabrasCuerpoConsentimiento(p.cuerpo);
      expect(words).withContext(`${tipo} words=${words}`).toBeLessThanOrEqual(CONSENTIMIENTO_CUERPO_MAX_WORDS);
      expect(words).toBeGreaterThan(40);
    }
  });

  it('reemplaza placeholders con valores del mapa', () => {
    const out = reemplazarPlaceholdersConsentimiento('Clínica {{clinica}} · {{paciente}} · {{tipo}}', {
      clinica: 'Katzen Sur',
      paciente: 'Michi',
      tipo: 'Cirugía',
    });
    expect(out).toBe('Clínica Katzen Sur · Michi · Cirugía');
    expect(out).not.toContain('{{');
  });

  it('usa guión cuando falta un placeholder', () => {
    expect(reemplazarPlaceholdersConsentimiento('Vet: {{veterinario}}', {})).toBe('Vet: —');
  });

  it('buildConsentimientoDocumentoView sustituye placeholders y escapa HTML', () => {
    for (const tipo of CONSENTIMIENTO_TIPOS) {
      const view = buildConsentimientoDocumentoView({
        tipo,
        clinica: 'Clínica <Test>',
        paciente: 'Luna & Co',
        dueno: 'Ana',
        fecha: '2026-10-04',
        veterinario: 'Dra. Pérez',
        procedimiento: 'OVH electiva\nAyuno 8 h',
        firmado_por: 'Ana López',
        parentesco: 'Dueña',
      });
      expect(view.tipo).toBe(tipo);
      expect(view.cuerpoHtml).not.toContain('{{clinica}}');
      expect(view.cuerpoHtml).not.toContain('{{paciente}}');
      expect(view.cuerpoHtml).toContain('Clínica &lt;Test&gt;');
      expect(view.cuerpoHtml).toContain('Luna &amp; Co');
      expect(view.cuerpoHtml).toContain('Ana López');
      expect(view.cuerpoHtml).toContain('Dueña');
      expect(view.cuerpoHtml).toContain('<br />');
      expect(view.disclaimer).toContain('Borrador clínico');
      const plain = htmlConsentimientoATextoPlano(view.cuerpoHtml);
      expect(plain.length).toBeGreaterThan(100);
      expect(plain).toContain('Luna & Co');
    }
  });

  it('nombre de PDF sigue consentimiento-{tipo}-{paciente}-{fecha}.pdf', () => {
    const view = buildConsentimientoDocumentoView({
      tipo: 'anestesia',
      paciente: 'Rocky Jr.',
      fecha: '2026-10-04',
      clinica: 'KatzenVet',
    });
    expect(nombreArchivoPdfConsentimiento(view)).toBe('consentimiento-anestesia-Rocky-Jr-2026-10-04.pdf');
  });

  it('expone la lista canónica de placeholders', () => {
    expect(CONSENTIMIENTO_PLACEHOLDERS).toEqual(
      jasmine.arrayContaining([
        'clinica',
        'paciente',
        'dueno',
        'fecha',
        'tipo',
        'veterinario',
        'procedimiento',
        'firmado_por',
        'parentesco',
      ])
    );
  });
});
