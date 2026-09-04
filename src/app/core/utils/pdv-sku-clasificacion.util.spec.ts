import { PDV_SAMPLE_ROWS } from './pdv-sample-rows';
import {
  clasificarSkuPdv,
  parsearComponentesKit,
  prefijoCodigoPdv
} from './pdv-sku-clasificacion.util';

describe('pdv-sku-clasificacion.util', () => {
  it('parsea BOM Eleventa VAC010=1;VAC003=1;VAC005=1;', () => {
    const bom = parsearComponentesKit('VAC010=1;VAC003=1;VAC005=1;');
    expect(bom).toEqual([
      { codigo: 'VAC010', cantidad: 1 },
      { codigo: 'VAC003', cantidad: 1 },
      { codigo: 'VAC005', cantidad: 1 }
    ]);
  });

  it('kit huérfano: string vacío → sin componentes', () => {
    expect(parsearComponentesKit('')).toEqual([]);
    expect(parsearComponentesKit(null)).toEqual([]);
    expect(parsearComponentesKit(';;;')).toEqual([]);
  });

  it('prefijos KTZ / VAC / BACO / EXAM / EAN', () => {
    expect(prefijoCodigoPdv('KTZ073')).toBe('KTZ');
    expect(prefijoCodigoPdv('VAC003')).toBe('VAC');
    expect(prefijoCodigoPdv('V003')).toBe('VAC');
    expect(prefijoCodigoPdv('BACO014')).toBe('BACO');
    expect(prefijoCodigoPdv('EXAM002')).toBe('EXAM');
    expect(prefijoCodigoPdv('750155640001')).toBe('EAN');
  });

  it('samples inventario-fdb: destino anaquel/baño/servicio/kit', () => {
    const byCode = Object.fromEntries(PDV_SAMPLE_ROWS.map((r) => [r.codigo, clasificarSkuPdv(r)]));
    expect(byCode['VAC003'].destino).toBe('vacuna');
    expect(byCode['VAC003'].categoria).toBe('vacuna');
    expect(byCode['750155640001'].destino).toBe('anaquel');
    expect(byCode['750155640001'].categoria).toBe('accesorio');
    expect(byCode['7501234567890'].categoria).toBe('alimento');
    expect(byCode['BACO014'].destino).toBe('banho');
    expect(byCode['BACO014'].enlazarBanio).toBe(true);
    expect(byCode['BACO014'].categoria).toBe('peluqueria');
    expect(byCode['KTZ073'].prefijo).toBe('KTZ');
    expect(byCode['KTZ073'].categoria).toBe('medicamento');
    expect(byCode['EXAM002'].destino).toBe('examen');
    expect(byCode['PAQ001'].destino).toBe('kit');
    expect(byCode['PAQ001'].esKit).toBe(true);
    expect(byCode['PAQ001'].componentes.length).toBe(3);
    expect(byCode['DOM001'].destino).toBe('servicio');
    expect(byCode['USO001'].destino).toBe('uso_interno');
  });

  it('hallazgos FDB: UI/MI, V00x, cirugía y biometría', () => {
    expect(
      clasificarSkuPdv({
        codigo: 'UIBANERA',
        descripcion: 'UI Bañera',
        departamento: 'Equipo'
      }).destino
    ).toBe('uso_interno');
    expect(
      clasificarSkuPdv({
        codigo: '10256',
        descripcion: 'MI Solución HT 250ml',
        departamento: 'UsoInterno'
      }).destino
    ).toBe('uso_interno');
    expect(prefijoCodigoPdv('V002')).toBe('VAC');
    expect(
      clasificarSkuPdv({
        codigo: 'V002',
        descripcion: 'Vacuna Quintuple',
        departamento: 'Consultorio',
        componentes: ''
      }).destino
    ).toBe('vacuna');
    expect(
      clasificarSkuPdv({
        codigo: 'KTZ056',
        descripcion: 'Paq Cachorro',
        departamento: 'Paquetes',
        componentes: 'V002=3;V003=1;V004=1;'
      }).componentes
    ).toEqual([
      { codigo: 'V002', cantidad: 3 },
      { codigo: 'V003', cantidad: 1 },
      { codigo: 'V004', cantidad: 1 }
    ]);
  });

  it('Paq Castración sin COMPONENTES sigue siendo kit huérfano clasificado', () => {
    const c = clasificarSkuPdv({
      codigo: 'PAQ099',
      descripcion: 'Paq Castración',
      departamento: 'Paquetes',
      componentes: ''
    });
    expect(c.destino).toBe('kit');
    expect(c.esKit).toBe(true);
    expect(c.componentes.length).toBe(0);
    expect(c.notas.some((n) => /huérfano|huerfano/i.test(n))).toBe(true);
  });
});
