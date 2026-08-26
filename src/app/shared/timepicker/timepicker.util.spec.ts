import {
  buildMinuteOptions,
  formatHhMmDisplay,
  isValidHhMm,
  parseHhMm,
  toHhMm
} from './timepicker.util';

describe('timepicker.util', () => {
  describe('isValidHhMm', () => {
    it('acepta HH:mm válido', () => {
      expect(isValidHhMm('00:00')).toBeTrue();
      expect(isValidHhMm('9:05')).toBeTrue();
      expect(isValidHhMm('16:01')).toBeTrue();
      expect(isValidHhMm('23:59')).toBeTrue();
    });

    it('rechaza inválidos', () => {
      expect(isValidHhMm('')).toBeFalse();
      expect(isValidHhMm(null)).toBeFalse();
      expect(isValidHhMm('25:00')).toBeFalse();
      expect(isValidHhMm('12:60')).toBeFalse();
      expect(isValidHhMm('4:01 p.m.')).toBeFalse();
    });
  });

  describe('parse / toHhMm / display', () => {
    it('redondea mediodía y medianoche', () => {
      expect(parseHhMm('00:00')).toEqual({ hour12: 12, minute: 0, period: 'am' });
      expect(parseHhMm('12:00')).toEqual({ hour12: 12, minute: 0, period: 'pm' });
      expect(toHhMm({ hour12: 12, minute: 0, period: 'am' })).toBe('00:00');
      expect(toHhMm({ hour12: 12, minute: 0, period: 'pm' })).toBe('12:00');
    });

    it('formatea display español', () => {
      expect(formatHhMmDisplay('16:01')).toBe('04:01 p.m.');
      expect(formatHhMmDisplay('09:05')).toBe('09:05 a.m.');
      expect(formatHhMmDisplay('')).toBe('');
    });
  });

  describe('buildMinuteOptions', () => {
    it('respeta el paso', () => {
      expect(buildMinuteOptions(15)).toEqual([0, 15, 30, 45]);
      expect(buildMinuteOptions(1).length).toBe(60);
    });
  });
});
