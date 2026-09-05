import { siguienteFolioTicketDia, ymdDesdeFechaIso, folioVisibleTicket } from './folio-ticket-visita.util';

describe('folio-ticket-visita.util (spec 071)', () => {
  it('secuencia del día: primer ticket y siguientes', () => {
    expect(siguienteFolioTicketDia('2026-09-04', [])).toBe('KV-20260904-001');
    expect(siguienteFolioTicketDia('2026-09-04', ['KV-20260904-001', 'KV-20260904-003'])).toBe('KV-20260904-004');
    expect(siguienteFolioTicketDia('2026-09-04', ['KV-20260903-099', 'abc'])).toBe('KV-20260904-001');
  });

  it('ignora fecha inválida', () => {
    expect(siguienteFolioTicketDia('', [])).toBe('');
    expect(ymdDesdeFechaIso('2026-09-04T18:00:00')).toBe('20260904');
  });

  it('folio visible recorta espacios', () => {
    expect(folioVisibleTicket('  KV-20260904-001  ')).toBe('KV-20260904-001');
    expect(folioVisibleTicket(null)).toBe('');
  });
});
