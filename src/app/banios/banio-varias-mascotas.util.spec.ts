import { datosBanioMascotaExtra, otrasMascotasDelDueno } from './banio-varias-mascotas.util';

describe('banio-varias-mascotas.util', () => {
  const pacientes = [
    { id: 'tina', nombre: 'Tina' },
    { id: 'nacho', nombre: 'Nacho', tamano_perro: 'chico' },
    { id: 'coco', nombre: 'Coco' },
    { id: 'baja', nombre: 'Vieja', activo: false },
    { id: 'coco', nombre: 'Coco' },
  ];

  it('lista las otras mascotas activas del dueño, sin repetir y por nombre', () => {
    expect(otrasMascotasDelDueno(pacientes, 'tina').map((m) => m.nombre)).toEqual(['Coco', 'Nacho']);
  });

  it('sin lista no truena', () => {
    expect(otrasMascotasDelDueno(null, 'x')).toEqual([]);
  });

  it('el baño extra copia servicio, fecha y hora, sin precio ni domicilio', () => {
    const base = {
      paciente_id: 'tina',
      paciente: 'Tina',
      cliente_id: 'c1',
      tipo_servicio: 'baño',
      fecha_banio: '2026-10-27',
      hora_banio: '17:30',
      precio_total: 280,
      precio_base: 280,
      domicilio: { precio: 100 },
      costoEstimado: 50,
      tamano_perro: 'grande',
    };
    const [nacho] = otrasMascotasDelDueno(pacientes, 'tina').filter((m) => m.id === 'nacho');
    const d = datosBanioMascotaExtra(base, nacho, ['pulgas']);
    expect(d['paciente_id']).toBe('nacho');
    expect(d['paciente']).toBe('Nacho');
    expect(d['cliente_id']).toBe('c1');
    expect(d['tipo_servicio']).toBe('baño');
    expect(d['hora_banio']).toBe('17:30');
    expect(d['precio_total']).toBe(0);
    expect(d['domicilio']).toBeUndefined();
    expect(d['costoEstimado']).toBeUndefined();
    expect(d['tamano_perro']).toBe('pequeno');
    expect(d['alergias_conocidas']).toEqual(['pulgas']);
    expect(base.precio_total).toBe(280);
  });

  it('si la mascota extra no tiene tamaño, no hereda el de la principal', () => {
    const [coco] = otrasMascotasDelDueno(pacientes, 'tina');
    expect(datosBanioMascotaExtra({ tamano_perro: 'grande' }, coco, [])['tamano_perro']).toBeUndefined();
  });

  it('cada mascota extra lleva su servicio, precio, nota y tamaño', () => {
    const base = { tipo_servicio: 'baño', fecha_banio: '2026-10-28', hora_banio: '10:47', observaciones: 'nota de Eli', pagado: true, precio_total: 300 };
    const [coco] = otrasMascotasDelDueno(pacientes, 'tina');
    const d = datosBanioMascotaExtra(base, coco, [], { servicio: 'baño_medicado', precio: 250, nota: 'piel sensible', tamano: 'mediano' });
    expect(d['tipo_servicio']).toBe('baño_medicado');
    expect(d['precio_total']).toBe(250);
    expect(d['precio_base']).toBe(250);
    expect(d['observaciones']).toBe('piel sensible');
    expect(d['tamano_perro']).toBe('mediano');
    expect(d['pagado']).toBeTrue();
    expect(d['hora_banio']).toBe('10:47');
  });

  it('sin precio ni nota propios: falta el precio y no copia la nota de la principal', () => {
    const [coco] = otrasMascotasDelDueno(pacientes, 'tina');
    const d = datosBanioMascotaExtra({ tipo_servicio: 'baño', observaciones: 'nota de Eli', precio_total: 300 }, coco, [], { precio: null });
    expect(d['tipo_servicio']).toBe('baño');
    expect(d['precio_total']).toBe(0);
    expect(d['observaciones']).toBe('');
  });

  it('una mascota extra puede llevar varios servicios con un solo precio', () => {
    const [coco] = otrasMascotasDelDueno(pacientes, 'tina');
    const d = datosBanioMascotaExtra({ tipo_servicio: 'baño' }, coco, [], {
      servicio: 'baño_con_corte',
      serviciosExtra: ['corte_uñas'],
      precio: 350,
    });
    expect(d['tipo_servicio']).toBe('baño_con_corte');
    expect(d['servicios_adicionales']).toEqual([{ servicio: 'corte_uñas', precio: 0 }]);
    expect(d['precio_total']).toBe(350);
  });
});
