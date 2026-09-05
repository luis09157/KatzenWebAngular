import {
  esFolioCapturadoValido,
  etiquetaExpedientePaciente,
  folioCortoDesdeId,
  folioExpedientePaciente,
  resolverExpedienteParaPersistir,
} from './folio-expediente-paciente.util';

describe('folio-expediente-paciente.util (spec 068)', () => {
  const uuidPucca = '4b60f946-565a-43fe-8a28-95cfb516c555';

  it('id UUID: deriva KV- + últimos 6 alfanuméricos en mayúsculas', () => {
    expect(folioCortoDesdeId(uuidPucca)).toBe('16C555');
    expect(folioExpedientePaciente({ id: uuidPucca })).toBe('KV-16C555');
    expect(etiquetaExpedientePaciente({ id: uuidPucca })).toBe('Expediente KV-16C555');
  });

  it('id corto: usa el id limpio con prefijo KV-', () => {
    expect(folioExpedientePaciente({ id: 'abc123' })).toBe('KV-ABC123');
    expect(folioExpedientePaciente({ id: 'mascota-luis' })).toBe('KV-TALUIS');
  });

  it('capturado de clínica gana: número Excel o folio corto, sin derivar del id', () => {
    expect(
      folioExpedientePaciente({
        id: uuidPucca,
        expediente: '1847',
      })
    ).toBe('1847');
    expect(
      folioExpedientePaciente({
        id: uuidPucca,
        expediente: 'EXP-PUCCA',
      })
    ).toBe('EXP-PUCCA');
    expect(
      folioExpedientePaciente({
        id: 'otro-id',
        numeroExpediente: 'EXP-12',
      })
    ).toBe('EXP-12');
  });

  it('no usa el expediente del dueño como si fuera de la mascota', () => {
    expect(
      folioExpedientePaciente({
        id: uuidPucca,
        expedienteCliente: '1847',
      })
    ).toBe('KV-16C555');
    expect(
      folioExpedientePaciente({
        id: uuidPucca,
        expediente: '',
        expedienteCliente: 'EXP-DUEÑO',
      })
    ).toBe('KV-16C555');
  });

  it('expediente UUID o vacío: deriva del id; sin id usa KV-S/N', () => {
    expect(folioExpedientePaciente({ id: uuidPucca, expediente: uuidPucca })).toBe('KV-16C555');
    expect(folioExpedientePaciente({ id: '', expediente: '' })).toBe('KV-S/N');
    expect(folioExpedientePaciente(null)).toBe('KV-S/N');
  });

  it('esFolioCapturadoValido: corto no-UUID sí; UUID/vacío/largo no', () => {
    expect(esFolioCapturadoValido('1847')).toBe(true);
    expect(esFolioCapturadoValido('KV-A1B2C3')).toBe(true);
    expect(esFolioCapturadoValido(uuidPucca)).toBe(false);
    expect(esFolioCapturadoValido('')).toBe(false);
    expect(esFolioCapturadoValido('x'.repeat(21))).toBe(false);
  });

  it('persistir: capturado se guarda; vacío genera KV estable del id', () => {
    expect(resolverExpedienteParaPersistir('1847', uuidPucca)).toBe('1847');
    expect(resolverExpedienteParaPersistir('  EXP-PUCCA  ', uuidPucca)).toBe('EXP-PUCCA');
    expect(resolverExpedienteParaPersistir('', uuidPucca)).toBe('KV-16C555');
    expect(resolverExpedienteParaPersistir(uuidPucca, uuidPucca)).toBe('KV-16C555');
    expect(resolverExpedienteParaPersistir(null, 'seed-mascota-001')).toBe('KV-OTA001');
  });
});
