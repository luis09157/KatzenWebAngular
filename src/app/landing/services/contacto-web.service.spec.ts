import { ContactoWebService } from './contacto-web.service';

describe('ContactoWebService', () => {
  let service: ContactoWebService;
  let pushSpy: jasmine.Spy;

  beforeEach(() => {
    pushSpy = jasmine.createSpy('push').and.returnValue(Promise.resolve({ key: 'abc123' }));
    const dbMock = {
      list: jasmine.createSpy('list').and.returnValue({ push: pushSpy })
    };
    service = new ContactoWebService(dbMock as never);
  });

  it('guarda mensaje con campos recortados', async () => {
    const id = await service.enviar({
      nombre: '  Luis  ',
      email: 'LUIS@TEST.COM',
      telefono: '8136024090',
      mascota: 'Oreon',
      mensaje: 'Quisiera agendar una consulta para mi gato.'
    });

    expect(id).toBe('abc123');
    expect(pushSpy).toHaveBeenCalled();
    const payload = pushSpy.calls.mostRecent().args[0];
    expect(payload.nombre).toBe('Luis');
    expect(payload.email).toBe('luis@test.com');
    expect(payload.origen).toBe('landing');
    expect(payload.leido).toBeFalse();
  });

  it('rechaza email inválido', async () => {
    await expectAsync(service.enviar({
      nombre: 'Luis',
      email: 'no-es-email',
      telefono: '8136024090',
      mascota: 'Oreon',
      mensaje: 'Mensaje de prueba suficientemente largo.'
    })).toBeRejected();
  });
});
