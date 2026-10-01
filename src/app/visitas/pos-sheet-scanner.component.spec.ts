import { PosSheetScannerComponent } from './pos-sheet-scanner.component';

describe('PosSheetScannerComponent (spec 081)', () => {
  it('onCodigo emite codigoChange', () => {
    const c = new PosSheetScannerComponent();
    const seen: string[] = [];
    c.codigoChange.subscribe((v) => seen.push(v));
    c.onCodigo('750');
    expect(c.codigo).toBe('750');
    expect(seen).toEqual(['750']);
  });
});
