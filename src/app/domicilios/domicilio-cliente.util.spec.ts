import { direccionDeCliente } from './domicilio-cliente.util';

describe('domicilio-cliente.util', () => {
  it('arma la dirección con calle, número, colonia y municipio', () => {
    expect(
      direccionDeCliente({ calle: 'Héctor Espino', numero: '603', colonia: 'Deportivo Huinalá', municipio: 'Apodaca' })
        .texto
    ).toBe('Héctor Espino #603, Deportivo Huinalá, Apodaca');
  });

  it('usa «direccion» si no hay campos sueltos', () => {
    expect(direccionDeCliente({ direccion: 'Calle 1' }).texto).toBe('Calle 1');
    expect(direccionDeCliente(null).texto).toBe('');
  });
});
