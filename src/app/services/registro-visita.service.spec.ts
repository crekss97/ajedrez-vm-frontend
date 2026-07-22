import { DOCUMENT } from '@angular/common';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EventosService } from './evento.service';
import { RegistroVisitaService } from './registro-visita.service';

describe('RegistroVisitaService', () => {
  let service: RegistroVisitaService;
  let eventosService: jasmine.SpyObj<EventosService>;
  let documento: Document & { cambiarVisibilidad?: (estado: DocumentVisibilityState) => void };
  let visibilityHandler: EventListener | undefined;

  beforeEach(() => {
    eventosService = jasmine.createSpyObj<EventosService>('EventosService', ['registrarConsulta']);
    eventosService.registrarConsulta.and.returnValue(of({ views: 1 }));
    visibilityHandler = undefined;
    documento = {
      visibilityState: 'visible',
      defaultView: window,
      addEventListener: jasmine.createSpy('addEventListener').and.callFake(
        (_type: string, listener: EventListener) => {
          visibilityHandler = listener;
        },
      ),
      removeEventListener: jasmine.createSpy('removeEventListener'),
    } as unknown as Document & { cambiarVisibilidad?: (estado: DocumentVisibilityState) => void };
    documento.cambiarVisibilidad = (estado) => {
      (documento as unknown as { visibilityState: DocumentVisibilityState }).visibilityState = estado;
      visibilityHandler?.(new Event('visibilitychange'));
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: documento },
        { provide: EventosService, useValue: eventosService },
      ],
    });
    service = TestBed.inject(RegistroVisitaService);
  });

  afterEach(() => {
    localStorage.removeItem('ajedrez-vm:visitor-id:v1');
    for (const slug of ['torneo-apertura', 'evento-oculto', 'evento-error', 'evento-a', 'evento-b']) {
      sessionStorage.removeItem(`ajedrez-vm:event-view:v1:${encodeURIComponent(slug)}`);
    }
  });

  it('espera tres segundos de visibilidad antes de registrar una visita', fakeAsync(() => {
    const cancelar = service.programar('torneo-apertura');

    tick(2_999);
    expect(eventosService.registrarConsulta).not.toHaveBeenCalled();

    tick(1);

    expect(eventosService.registrarConsulta).toHaveBeenCalledOnceWith(
      'torneo-apertura',
      jasmine.any(Number),
      jasmine.any(String),
      jasmine.any(String),
    );
    expect(eventosService.registrarConsulta.calls.mostRecent().args[1]).toBeGreaterThanOrEqual(3_000);
    cancelar();
  }));

  it('espera a que la pestaña sea visible si comienza oculta', fakeAsync(() => {
    (documento as unknown as { visibilityState: DocumentVisibilityState }).visibilityState = 'hidden';
    const cancelar = service.programar('evento-oculto');

    tick(5_000);
    expect(eventosService.registrarConsulta).not.toHaveBeenCalled();

    documento.cambiarVisibilidad?.('visible');
    tick(2_999);
    expect(eventosService.registrarConsulta).not.toHaveBeenCalled();
    tick(1);

    expect(eventosService.registrarConsulta).toHaveBeenCalledTimes(1);
    cancelar();
  }));

  it('reinicia el período cuando la pestaña se oculta antes del umbral', fakeAsync(() => {
    const cancelar = service.programar('torneo-apertura');

    tick(1_000);
    documento.cambiarVisibilidad?.('hidden');
    tick(5_000);
    expect(eventosService.registrarConsulta).not.toHaveBeenCalled();

    documento.cambiarVisibilidad?.('visible');
    tick(2_999);
    expect(eventosService.registrarConsulta).not.toHaveBeenCalled();
    tick(1);
    expect(eventosService.registrarConsulta).toHaveBeenCalledTimes(1);
    cancelar();
  }));

  it('cancela temporizadores y listeners al limpiar el registro', fakeAsync(() => {
    const cancelar = service.programar('torneo-apertura');

    cancelar();
    tick(5_000);

    expect(eventosService.registrarConsulta).not.toHaveBeenCalled();
    expect(documento.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      jasmine.any(Function),
    );
  }));

  it('no repite la visita registrada durante la ventana local', fakeAsync(() => {
    const cancelarPrimera = service.programar('torneo-apertura');
    tick(3_000);
    cancelarPrimera();
    eventosService.registrarConsulta.calls.reset();

    const cancelarSegunda = service.programar('torneo-apertura');
    tick(3_000);

    expect(eventosService.registrarConsulta).not.toHaveBeenCalled();
    cancelarSegunda();
  }));

  it('permite reintentar si falla la petición de registro', fakeAsync(() => {
    eventosService.registrarConsulta.and.returnValue(
      throwError(() => new Error('fallo de red')),
    );
    const cancelarPrimera = service.programar('evento-error');
    tick(3_000);
    cancelarPrimera();
    eventosService.registrarConsulta.calls.reset();
    eventosService.registrarConsulta.and.returnValue(of({ views: 1 }));

    const cancelarSegunda = service.programar('evento-error');
    tick(3_000);

    expect(eventosService.registrarConsulta).toHaveBeenCalledTimes(1);
    cancelarSegunda();
  }));

  it('reutiliza el visitorId anónimo entre eventos', fakeAsync(() => {
    const cancelarPrimera = service.programar('evento-a');
    tick(3_000);
    cancelarPrimera();
    const primerVisitorId = eventosService.registrarConsulta.calls.mostRecent().args[2];

    const cancelarSegunda = service.programar('evento-b');
    tick(3_000);
    const segundoVisitorId = eventosService.registrarConsulta.calls.mostRecent().args[2];

    expect(segundoVisitorId).toBe(primerVisitorId);
    cancelarSegunda();
  }));
});
