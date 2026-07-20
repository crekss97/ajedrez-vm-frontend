import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventoEditorDraft, EventoEditorInput } from '../../models/editor';
import { EditorEventosService } from '../../services/editor-eventos.service';
import { EditorEventos } from './editor-eventos';

describe('EditorEventos', () => {
  let fixture: ComponentFixture<EditorEventos>;
  let component: EditorEventos;
  let service: jasmine.SpyObj<EditorEventosService>;

  const savedEvent: EventoEditorDraft = {
    id: 39,
    slug: 'festival-de-ajedrez-abierto',
    titulo: 'Festival de ajedrez abierto',
    categoria: 'Torneo',
    descripcionCorta: 'Una jornada abierta para toda la comunidad ajedrecística.',
    descripcionLarga: '<p>Programa completo del encuentro.</p>',
    fechaInicio: '2026-08-10T21:00:00.000Z',
    fechaFin: '2026-08-10T23:00:00.000Z',
    ubicacion: 'Buenos Aires',
    organizador: 'Ajedrez VM',
    imagenUrl: '/api/uploads/imagen',
    destacado: false,
    modalidad: 'Presencial',
    tags: ['torneo'],
    views: 0,
    linksExternos: [],
    adjuntos: [],
    estadoEditorial: 'draft',
    fuente: 'editor',
    creadoPor: 'editor@ajedrezvm.com',
    actualizadoEn: '2026-07-20T00:00:00.000Z',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<EditorEventosService>(
      'EditorEventosService',
      ['createEvent', 'updateEvent'],
      { drafts$: of([]) },
    );
    service.createEvent.and.returnValue(of(savedEvent));
    service.updateEvent.and.returnValue(of(savedEvent));

    await TestBed.configureTestingModule({
      imports: [EditorEventos],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: EditorEventosService, useValue: service },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorEventos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('inicia una ficha accesible como borrador y sin precio', () => {
    const form = (component as any).eventForm;
    const title = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;
    const imageInput = fixture.nativeElement.querySelector('#imagen-input') as HTMLInputElement;
    const visibleStartDate = fixture.nativeElement.querySelector(
      '#fecha-inicio-visible',
    ) as HTMLInputElement;

    expect(title.textContent).toContain('Crear evento');
    expect(form.controls.estadoEditorial.value).toBe('draft');
    expect(form.controls.destacado.disabled).toBeTrue();
    expect(form.contains('precio')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.publication-layout')).not.toBeNull();
    const generatedPlaceholders = Array.from(
      fixture.nativeElement.querySelectorAll('[placeholder]') as NodeListOf<HTMLElement>,
    );
    expect(generatedPlaceholders.every((element) => element.getAttribute('placeholder') === '')).toBeTrue();
    expect(imageInput.getAttribute('aria-required')).toBe('true');
    expect(visibleStartDate.getAttribute('aria-describedby')).toBe('fecha-inicio-error');
    expect(fixture.nativeElement.querySelector('label[for="fecha-inicio-visible"]')).not.toBeNull();
    expect((component as any).dateTimeOptions.minDate).toBe('today');
    const remainingHelp = fixture.nativeElement.querySelectorAll('[id$="-help"]');
    expect(remainingHelp.length).toBe(1);
    expect(remainingHelp[0].id).toBe('pdf-help');
    expect(remainingHelp[0].textContent?.trim()).toBe('Hasta 5 PDF.');
  });

  it('solo permite destacar eventos publicados', () => {
    const form = (component as any).eventForm;
    expect(fixture.nativeElement.querySelector('.editor-toggle')).toBeNull();

    form.controls.estadoEditorial.setValue('published');
    fixture.detectChanges();
    expect(form.controls.destacado.enabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.editor-toggle')).not.toBeNull();

    form.controls.destacado.setValue(true);
    form.controls.estadoEditorial.setValue('draft');
    fixture.detectChanges();
    expect(form.controls.destacado.value).toBeFalse();
    expect(form.controls.destacado.disabled).toBeTrue();
    expect(fixture.nativeElement.querySelector('.editor-toggle')).toBeNull();
  });

  it('rechaza una fecha final que no sea posterior al inicio', () => {
    const form = (component as any).eventForm;
    form.patchValue({
      fechaInicio: '2026-08-10T18:00',
      fechaFin: '2026-08-10T17:45',
    });
    form.controls.fechaFin.markAsTouched();
    fixture.detectChanges();

    expect(form.hasError('fechaFinAnterior')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#fecha-fin-error')?.textContent).toContain(
      'posterior al inicio',
    );

    form.controls.fechaFin.setValue('2026-08-10T19:00');
    expect(form.hasError('fechaFinAnterior')).toBeFalse();
  });

  it('rechaza fechas de inicio anteriores al día actual', () => {
    const form = (component as any).eventForm;
    form.controls.fechaInicio.setValue('2020-01-01T10:00');
    form.controls.fechaInicio.markAsTouched();
    fixture.detectChanges();

    expect(form.controls.fechaInicio.hasError('fechaAnterior')).toBeTrue();
    expect(fixture.nativeElement.querySelector('#fecha-inicio-error')?.textContent).toContain(
      'anterior a hoy',
    );
  });

  it('envía las fechas como instantes de Buenos Aires y no incluye precio', () => {
    const form = (component as any).eventForm;
    form.setValue({
      titulo: 'Festival de ajedrez abierto',
      slug: '',
      categoria: 'Torneo',
      descripcionCorta: 'Una jornada abierta para toda la comunidad ajedrecística.',
      descripcionLarga: '<p>Programa completo del encuentro.</p>',
      fechaInicio: '2026-08-10T18:00',
      fechaFin: '2026-08-10T20:00',
      ubicacion: 'Buenos Aires',
      organizador: 'Ajedrez VM',
      imagenUrl: 'blob:imagen',
      destacado: false,
      modalidad: 'Presencial',
      tags: 'torneo, comunidad',
      estadoEditorial: 'draft',
    });
    const image = new File(['imagen'], 'afiche.jpg', { type: 'image/jpeg' });
    (component as any).imageFile.set(image);

    (component as any).saveEvent();

    expect(service.createEvent).toHaveBeenCalled();
    const input = service.createEvent.calls.mostRecent().args[0] as EventoEditorInput;
    expect(input.fechaInicio).toBe('2026-08-10T21:00:00.000Z');
    expect(input.fechaFin).toBe('2026-08-10T23:00:00.000Z');
    expect(input.tags).toEqual(['torneo', 'comunidad']);
    expect(Object.hasOwn(input, 'precio')).toBeFalse();
  });

  it('convierte los instantes guardados a Buenos Aires al editar', () => {
    (component as any).startEdit(savedEvent);
    fixture.detectChanges();
    const form = (component as any).eventForm;

    expect(form.controls.fechaInicio.value).toBe('2026-08-10T18:00');
    expect(form.controls.fechaFin.value).toBe('2026-08-10T20:00');
    expect(form.controls.imagenUrl.value).toBe('/api/uploads/imagen');

    (component as any).saveEvent();

    expect(service.updateEvent).toHaveBeenCalled();
    const input = service.updateEvent.calls.mostRecent().args[1] as EventoEditorInput;
    expect(input.fechaInicio).toBe(savedEvent.fechaInicio);
    expect(input.fechaFin).toBe(savedEvent.fechaFin);
  });

  it('lleva el foco al primer campo inválido al intentar guardar', async () => {
    (component as any).saveEvent();
    fixture.detectChanges();
    await Promise.resolve();

    expect(document.activeElement?.id).toBe('titulo');
    expect(fixture.nativeElement.querySelector('#titulo-error')?.textContent).toContain(
      'obligatorio',
    );
  });
});
