import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompartirEventoService } from '../../services/compartir-evento.service';
import { CompartirEvento } from './compartir-evento';

describe('CompartirEvento', () => {
  let fixture: ComponentFixture<CompartirEvento>;
  let service: jasmine.SpyObj<CompartirEventoService>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<CompartirEventoService>('CompartirEventoService', [
      'urlEvento',
      'copiar',
    ]);
    service.urlEvento.and.returnValue('https://ajedrez.test/eventos/apertura');
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

  it('copia el enlace sin abrir opciones de redes sociales', async () => {
    const trigger = fixture.nativeElement.querySelector('.share-trigger') as HTMLButtonElement;

    expect(trigger.textContent).toContain('Copiar enlace');
    expect(trigger.getAttribute('aria-label')).toBe('Copiar enlace de Torneo Apertura');
    expect(fixture.nativeElement.querySelector('dialog')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('a').length).toBe(0);

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
});
