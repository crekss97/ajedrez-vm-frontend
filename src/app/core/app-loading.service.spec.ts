import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import {
  AppLoadingService,
  MINIMO_VISIBLE_CARGADOR_MS,
  RETARDO_CARGADOR_MS,
} from './app-loading.service';

describe('AppLoadingService', () => {
  let service: AppLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppLoadingService);
  });

  it('no muestra el cargador para una operacion rapida', fakeAsync(() => {
    const finalizar = service.iniciar();

    finalizar();
    tick(RETARDO_CARGADOR_MS);

    expect(service.cargando()).toBeFalse();
    expect(service.visible()).toBeFalse();
  }));

  it('muestra el cargador de inmediato para una navegacion', fakeAsync(() => {
    const finalizar = service.iniciar(true);

    expect(service.cargando()).toBeTrue();
    expect(service.visible()).toBeTrue();

    finalizar();
    tick(MINIMO_VISIBLE_CARGADOR_MS);
    expect(service.visible()).toBeFalse();
  }));

  it('respeta el tiempo minimo una vez visible', fakeAsync(() => {
    const finalizar = service.iniciar();

    tick(RETARDO_CARGADOR_MS);
    expect(service.visible()).toBeTrue();

    finalizar();
    tick(MINIMO_VISIBLE_CARGADOR_MS - 1);
    expect(service.visible()).toBeTrue();

    tick(1);
    expect(service.visible()).toBeFalse();
  }));

  it('espera a que finalicen todas las operaciones concurrentes', fakeAsync(() => {
    const finalizarPrimera = service.iniciar();
    const finalizarSegunda = service.iniciar();

    tick(RETARDO_CARGADOR_MS);
    finalizarPrimera();

    expect(service.cargando()).toBeTrue();
    expect(service.visible()).toBeTrue();

    finalizarSegunda();
    tick(MINIMO_VISIBLE_CARGADOR_MS);

    expect(service.cargando()).toBeFalse();
    expect(service.visible()).toBeFalse();
  }));

  it('ignora finalizaciones repetidas', fakeAsync(() => {
    const finalizar = service.iniciar();

    finalizar();
    finalizar();
    tick(RETARDO_CARGADOR_MS);

    expect(service.cargando()).toBeFalse();
    expect(service.visible()).toBeFalse();
  }));

  it('cancela el ocultamiento cuando comienza otra operacion', fakeAsync(() => {
    const finalizarPrimera = service.iniciar();
    tick(RETARDO_CARGADOR_MS);
    finalizarPrimera();
    tick(MINIMO_VISIBLE_CARGADOR_MS / 2);

    const finalizarSegunda = service.iniciar();
    tick(MINIMO_VISIBLE_CARGADOR_MS);

    expect(service.cargando()).toBeTrue();
    expect(service.visible()).toBeTrue();

    finalizarSegunda();
    tick(0);
    expect(service.visible()).toBeFalse();
  }));
});
