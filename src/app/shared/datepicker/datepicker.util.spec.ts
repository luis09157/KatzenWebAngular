import {
  coerceToIsoDate,
  formatLocalDateTimeStamp,
  formatLocalDateToIso,
  formatearFechaLocalEs,
  parseFechaTecleada,
  parseIsoDateToLocalDate,
} from './datepicker.util';

describe('datepicker.util (090)', () => {
  it('parseIsoDateToLocalDate / formatLocalDateToIso round-trip', () => {
    const d = parseIsoDateToLocalDate('2026-10-02');
    expect(d).toBeTruthy();
    expect(formatLocalDateToIso(d)).toBe('2026-10-02');
  });

  it('coerceToIsoDate acepta Date e ISO fecha-solo', () => {
    expect(coerceToIsoDate('2026-03-15')).toBe('2026-03-15');
    expect(coerceToIsoDate(new Date(2026, 9, 2))).toBe('2026-10-02');
    expect(coerceToIsoDate(null)).toBe('');
  });

  it('rechaza basura', () => {
    expect(parseIsoDateToLocalDate('no-fecha')).toBeNull();
    expect(parseIsoDateToLocalDate('')).toBeNull();
  });

  it('formatLocalDateTimeStamp usa componentes locales (no UTC de toISOString)', () => {
    const localEvening = new Date(2026, 9, 18, 20, 35, 42);
    expect(formatLocalDateTimeStamp(localEvening)).toBe('2026-10-18 20:35:42');
    // Contraste: el día UTC de toISOString puede diferir del calendario local
    expect(formatLocalDateTimeStamp(localEvening).slice(0, 10)).toBe(formatLocalDateToIso(localEvening));
  });

  it('formatearFechaLocalEs no resta día en fecha-solo ISO (bug MX)', () => {
    // new Date('yyyy-MM-dd') = UTC midnight; display debe ser el día del string, no getDate() local
    expect(formatearFechaLocalEs('2026-10-19')).toBe('19/10/2026');
    expect(formatearFechaLocalEs('2026-10-18')).toBe('18/10/2026');
  });

  it('formatearFechaLocalEs usa día de calendario en created_at naive', () => {
    expect(formatearFechaLocalEs('2026-10-18 20:35:42')).toBe('18/10/2026');
    expect(formatearFechaLocalEs(new Date(2026, 9, 19))).toBe('19/10/2026');
  });

  it('formatearFechaLocalEs no voltea un dd/mm/aaaa que ya está armado', () => {
    expect(formatearFechaLocalEs('01/10/2026')).toBe('01/10/2026');
    expect(formatearFechaLocalEs('10/01/2026')).toBe('10/01/2026');
    expect(formatearFechaLocalEs('26/10/2026')).toBe('26/10/2026');
  });
});

describe('parseFechaTecleada (2026-10-26)', () => {
  const iso = (d: Date | null) => (d ? formatLocalDateToIso(d) : null);

  it('dd/mm/aaaa es día/mes (no mes/día)', () => {
    expect(iso(parseFechaTecleada('02/10/2026'))).toBe('2026-10-02');
    expect(iso(parseFechaTecleada('2/10/26'))).toBe('2026-10-02');
    expect(iso(parseFechaTecleada('25-10-2026'))).toBe('2026-10-25');
  });

  it('aaaa-mm-dd no se recorre un día por la zona horaria', () => {
    expect(iso(parseFechaTecleada('2026-10-02'))).toBe('2026-10-02');
  });

  it('fechas imposibles o texto → null', () => {
    expect(parseFechaTecleada('31/02/2026')).toBeNull();
    expect(parseFechaTecleada('13/13/2026')).toBeNull();
    expect(parseFechaTecleada('mañana')).toBeNull();
    expect(parseFechaTecleada('')).toBeNull();
  });
});
