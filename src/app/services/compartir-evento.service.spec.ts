import { TestBed } from '@angular/core/testing';
import { CompartirEventoService } from './compartir-evento.service';

describe('CompartirEventoService', () => {
  let service: CompartirEventoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompartirEventoService);
  });

  it('construye la URL pública desde el origen actual y codifica el slug', () => {
    expect(service.urlEvento('torneo / apertura')).toBe(
      `${window.location.origin}/eventos/torneo%20%2F%20apertura`,
    );
  });

  it('delega la copia en navigator.clipboard', async () => {
    const clipboard = { writeText: jasmine.createSpy().and.resolveTo() };
    const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });

    await service.copiar('https://example.com/eventos/apertura');

    expect(clipboard.writeText).toHaveBeenCalledOnceWith('https://example.com/eventos/apertura');
    Object.defineProperty(
      navigator,
      'clipboard',
      descriptor ?? { configurable: true, value: undefined },
    );
  });
});
