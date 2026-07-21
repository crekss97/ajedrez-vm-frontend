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

  it('versiona la URL para renovar la vista previa de las redes', () => {
    expect(service.urlEvento('apertura', '2026-07-20T10:20:30.000Z')).toBe(
      `${window.location.origin}/eventos/apertura?v=2026-07-20T10%3A20%3A30.000Z`,
    );
  });

  it('construye la URL de WhatsApp con titulo y url', () => {
    const version = '2026-07-20T10:20:30.000Z';
    const eventoUrl = service.urlEvento('apertura', version);
    const url = service.urlWhatsApp('apertura', 'Torneo Apertura', version);
    expect(url).toContain('https://wa.me/?text=');
    expect(url).toContain(encodeURIComponent('Torneo Apertura'));
    expect(url).toContain(encodeURIComponent(eventoUrl));
  });

  it('construye la URL de Facebook con la url del evento', () => {
    const version = '2026-07-20T10:20:30.000Z';
    const url = service.urlFacebook('apertura', version);
    expect(url).toContain('https://www.facebook.com/sharer/sharer.php?u=');
    expect(url).toContain(encodeURIComponent(service.urlEvento('apertura', version)));
  });

  it('construye la URL de X con titulo y url del evento', () => {
    const version = '2026-07-20T10:20:30.000Z';
    const url = service.urlTwitter('apertura', 'Torneo Apertura', version);
    expect(url).toContain('https://twitter.com/intent/tweet?text=');
    expect(url).toContain(encodeURIComponent('Torneo Apertura'));
    expect(url).toContain(encodeURIComponent(service.urlEvento('apertura', version)));
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
