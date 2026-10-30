import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { BaniosService } from '../banios/banios.service';
import { RecordatoriosService } from '../recordatorios/recordatorios.service';
import { ParaAvisarDialogComponent } from './para-avisar-dialog.component';
import { AvisoPendiente } from './para-avisar.util';

describe('ParaAvisarDialogComponent — confirmar envío (2026-10-30)', () => {
  let component: ParaAvisarDialogComponent;
  let banios: { actualizarBanio: jasmine.Spy };
  const aviso: AvisoPendiente = {
    clave: 'k1',
    tipo: 'banio_manana',
    refs: [{ origen: 'banio', id: 'b1' }],
    clienteId: 'c1',
    dueno: 'Yuliana',
    mascotas: ['Pulga'],
    fecha: '2026-10-30',
    hora: '11:30',
    detalle: '',
    telefono10: '8112345678',
    mensaje: 'Hola',
    whatsappUrl: 'https://wa.me/528112345678?text=Hola',
  };

  beforeEach(() => {
    banios = { actualizarBanio: jasmine.createSpy('actualizarBanio').and.resolveTo() };
    TestBed.configureTestingModule({
      providers: [
        { provide: MatDialogRef, useValue: { close: jasmine.createSpy('close') } },
        { provide: AngularFireDatabase, useValue: {} },
        { provide: BaniosService, useValue: banios },
        { provide: RecordatoriosService, useValue: {} },
      ],
    });
    component = new ParaAvisarDialogComponent(
      TestBed.inject(MatDialogRef) as MatDialogRef<ParaAvisarDialogComponent>,
      TestBed.inject(Injector),
      TestBed.inject(AngularFireDatabase)
    );
    component.avisos = [aviso];
    spyOn(window, 'open').and.returnValue(null);
  });

  it('«Enviar al cliente» abre WhatsApp pero no marca nada', () => {
    component.enviar(aviso);
    expect(window.open).toHaveBeenCalledWith(aviso.whatsappUrl, '_blank', 'noopener');
    expect(banios.actualizarBanio).not.toHaveBeenCalled();
    expect(component.porConfirmar.has('k1')).toBeTrue();
    expect(component.estado.has('k1')).toBeFalse();
    expect(component.quedan).toBe(1);
  });

  it('«Sí, ya lo mandé» guarda la marca de enviado', async () => {
    component.enviar(aviso);
    await component.confirmarEnviado(aviso);
    expect(banios.actualizarBanio).toHaveBeenCalledTimes(1);
    const [id, cambio] = banios.actualizarBanio.calls.mostRecent().args;
    expect(id).toBe('b1');
    expect(Object.keys(cambio)).toEqual(['avisoEnviadoEn']);
    expect(component.estado.get('k1')).toBe('enviado');
    expect(component.porConfirmar.has('k1')).toBeFalse();
    expect(component.quedan).toBe(0);
  });

  it('«Todavía no» regresa a los botones sin guardar', () => {
    component.enviar(aviso);
    component.todaviaNo(aviso);
    expect(component.porConfirmar.has('k1')).toBeFalse();
    expect(banios.actualizarBanio).not.toHaveBeenCalled();
  });
});
