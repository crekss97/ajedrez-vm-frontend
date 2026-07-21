import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompartirEventoService } from '../../services/compartir-evento.service';
import { CompartirEvento } from './compartir-evento';

describe('CompartirEvento', () => {
  const version = '2026-07-20T10:20:30.000Z';
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
    service.urlEvento.and.returnValue(
      'https://ajedrez.test/eventos/apertura?v=2026-07-20T10%3A20%3A30.000Z',
    );
    service.urlWhatsApp.and.returnValue('https://wa.me/?text=evento-versionado');
    service.urlFacebook.and.returnValue('https://www.facebook.com/sharer/sharer.php?u=evento-versionado');
    service.urlTwitter.and.returnValue('https://twitter.com/intent/tweet?url=evento-versionado');
    service.copiar.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [CompartirEvento],
      providers: [{ provide: CompartirEventoService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(CompartirEvento);
    fixture.componentRef.setInput('slug', 'apertura');
    fixture.componentRef.setInput('titulo', 'Torneo Apertura');
    fixture.componentRef.setInput('actualizadoEn', version);
    fixture.detectChanges();
  });

  it('abre el dialogo y copia el enlace desde la barra inferior', async () => {
    const dialog = fixture.nativeElement.querySelector('.share-dialog') as HTMLDialogElement;
    const trigger = fixture.nativeElement.querySelector('.share-trigger') as HTMLButtonElement;
    const copy = fixture.nativeElement.querySelector('.share-link__field button') as HTMLButtonElement;

    expect(trigger.textContent).toContain('Compartir');
    expect(trigger.getAttribute('aria-label')).toBe('Compartir Torneo Apertura');
    expect(dialog.open).toBeFalse();

    trigger.click();
    expect(dialog.open).toBeTrue();

    expect(copy.textContent).toContain('Copiar');
    copy.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(service.copiar).toHaveBeenCalledOnceWith(
      'https://ajedrez.test/eventos/apertura?v=2026-07-20T10%3A20%3A30.000Z',
    );
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent.trim()).toBe(
      'Enlace copiado.',
    );
  });

  it('mantiene el enlace seleccionable cuando falla el portapapeles', async () => {
    service.copiar.and.rejectWith(new Error('Sin permiso'));

    (fixture.nativeElement.querySelector('.share-trigger') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.share-link__field button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();

    const manual = fixture.nativeElement.querySelector('.share-link input') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No se pudo copiar',
    );
    expect(manual.readOnly).toBeTrue();
    expect(manual.value).toBe(
      'https://ajedrez.test/eventos/apertura?v=2026-07-20T10%3A20%3A30.000Z',
    );
  });

  it('muestra enlaces a WhatsApp, Facebook y X', () => {
    const anchors = fixture.nativeElement.querySelectorAll('.share-network') as NodeListOf<HTMLAnchorElement>;

    expect(anchors.length).toBe(3);
    expect(anchors[0].getAttribute('href')).toBe(
      service.urlWhatsApp('apertura', 'Torneo Apertura', version),
    );
    expect(anchors[0].getAttribute('aria-label')).toBe('Compartir Torneo Apertura en WhatsApp');
    expect(anchors[1].getAttribute('href')).toBe(service.urlFacebook('apertura', version));
    expect(anchors[1].getAttribute('aria-label')).toBe('Compartir Torneo Apertura en Facebook');
    expect(anchors[2].getAttribute('href')).toBe(
      service.urlTwitter('apertura', 'Torneo Apertura', version),
    );
    expect(anchors[2].getAttribute('aria-label')).toBe('Compartir Torneo Apertura en X');
  });

  it('abre redes sociales en nueva ventana con noopener', () => {
    const anchors = fixture.nativeElement.querySelectorAll('.share-network') as NodeListOf<HTMLAnchorElement>;

    for (const a of anchors) {
      expect(a.target).toBe('_blank');
      expect(a.rel).toBe('noopener noreferrer');
    }
  });

  it('cierra el dialogo desde el boton de cierre', () => {
    const dialog = fixture.nativeElement.querySelector('.share-dialog') as HTMLDialogElement;

    (fixture.nativeElement.querySelector('.share-trigger') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.share-dialog__close') as HTMLButtonElement).click();

    expect(dialog.open).toBeFalse();
  });
});
