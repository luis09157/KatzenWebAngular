import { PaginatorEs } from './paginator-es';

describe('PaginatorEs', () => {
  it('dice «de» en vez de «of»', () => {
    const p = new PaginatorEs();
    expect(p.getRangeLabel(0, 20, 273)).toBe('1 – 20 de 273');
    expect(p.getRangeLabel(13, 20, 273)).toBe('261 – 273 de 273');
    expect(p.getRangeLabel(0, 20, 0)).toBe('0 de 0');
  });
});
