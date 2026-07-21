import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompartirEventoService } from '../../services/compartir-evento.service';
import { CompartirEvento } from './compartir-evento';

describe('CompartirEvento', () => {
  let fixture: ComponentFixture<CompartirEvento>;
  let service: jasmine.SpyObj<CompartirEventoService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<CompartirEventoService>('CompartirEventoService', [
      'urlEvento',
      'urlWhatsApp',
      'urlFacebook',
      'urlTwitter',
      'copiar',
    ]);
    service.urlEvento.and.returnValue('https://ajedrez.test/eventos/apertura');
    service.urlWhatsApp.and.returnValue('https://wa.me/?text=Torneo%20Apertura%20https%3A%2F%2Fajedrez.test%2Feventos%2Fapertura');
    service.urlFacebook.and.returnValue('https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fajedrez.test%2Feventos%2Fapertura');
    service.urlTwitter.and.returnValue('https://twitter.com/intent/tweet?text=Torneo%20Apertura&url=https%3A%2F%2Fajedrez.test%2Feventos%2Fapertura');
    service.copiar.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [CompartirEvento],
      providers: [{ provide: CompartirEventoService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CompartirEvento);
    fixture.componentRef.setInput('slug', 'apertura');
    fixture.componentRef.setInput('titulo', 'Torneo Apertura');
    fixture.detectChanges();
  });

  it('copia el enlace al portapapeles', async () => {
    const trigger = fixture.nativeElement.querySelector('.share-trigger') as HTMLButtonElement;

    expect(trigger.textContent).toContain('Copiar enlace');
    expect(trigger.getAttribute('aria-label')).toBe('Copiar enlace de Torneo Apertura');
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();

    trigger.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.copiar).toHaveBeenCalledOnceWith('https://ajedrez.test/eventos/apertura');
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent.trim()).toBe(
      'Enlace copiado.',
    );
  });

  it('revela un enlace seleccionable cuando falla el portapapeles', async () => {
    service.copiar.and.rejectWith(new Error('Sin permiso'));

    (fixture.nativeElement.querySelector('.share-trigger') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const manual = fixture.nativeElement.querySelector('.share-manual input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No se pudo copiar',
    );
    expect(manual.readOnly).toBeTrue();
    expect(manual.value).toBe('https://ajedrez.test/eventos/apertura');
  });

  it('muestra enlaces a WhatsApp, Facebook y X', () => {
    const anchors = fixture.nativeElement.querySelectorAll('.share-trigger--social') as NodeListOf<HTMLAnchorElement>;

    expect(anchors.length).toBe(3);
    expect(anchors[0].getAttribute('href')).toContain('https://wa.me/?text=');
    expect(anchors[0].getAttribute('aria-label')).toBe('Compartir Torneo Apertura en WhatsApp');
    expect(anchors[1].getAttribute('href')).toContain('https://www.facebook.com/sharer/sharer.php?u=');
    expect(anchors[1].getAttribute('aria-label')).toBe('Compartir Torneo Apertura en Facebook');
    expect(anchors[2].getAttribute('href')).toContain('https://twitter.com/intent/tweet?text=');
    expect(anchors[2].getAttribute('aria-label')).toBe('Compartir Torneo Apertura en X');
  });

  it('abre redes sociales en nueva ventana con noopener', () => {
    const anchors = fixture.nativeElement.querySelectorAll('.share-trigger--social') as NodeListOf<HTMLAnchorElement>;

    for (const a of anchors) {
      expect(a.target).toBe('_blank');
      expect(a.rel).toBe('noopener noreferrer');
    }
  });
});
