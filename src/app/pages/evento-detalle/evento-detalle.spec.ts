import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, ParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, Observable, of, Subject, throwError } from 'rxjs';

import { Evento } from '../../models/evento';
import { EventosService } from '../../services/evento.service';
import { RegistroVisitaService } from '../../services/registro-visita.service';
import { EventoDetalle } from './evento-detalle';

describe('EventoDetalle', () => {
  let fixture: ComponentFixture<EventoDetalle>;
  let eventosService: jasmine.SpyObj<EventosService>;
  let registroVisitaService: jasmine.SpyObj<RegistroVisitaService>;
  let paramMap$: BehaviorSubject<ParamMap>;
  let respuesta$: Subject<Evento>;
  let title: Title;

  const crearEvento = (valores: Partial<Evento> = {}): Evento => ({
    id: 40,
    slug: 'torneo-apertura',
    titulo: 'Torneo Apertura',
    categoria: 'Torneo',
    descripcionCorta: 'Primera fecha del circuito.',
    descripcionLarga: '<p>Una jornada abierta para toda la comunidad.</p>',
    fechaInicio: '2026-08-10T18:00:00.000Z',
    fechaFin: '2026-08-10T22:00:00.000Z',
    ubicacion: 'Club Central',
    organizador: 'Ajedrez VM',
    imagenUrl: '/api/uploads/imagen',
    destacado: true,
    modalidad: 'Presencial',
    tags: ['juvenil', 'ritmo-rapido'],
    views: 12,
    linksExternos: [
      { id: 'link-1', titulo: 'Sitio oficial', url: 'https://example.com/evento' },
    ],
    adjuntos: [
      { id: 'adjunto-1', nombre: 'Bases.pdf', url: '/api/uploads/1', tipo: 'application/pdf' },
    ],
    estadoEditorial: 'published',
    ...valores,
  });

  beforeEach(async () => {
    paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'torneo-apertura' }));
    respuesta$ = new Subject<Evento>();
    eventosService = jasmine.createSpyObj<EventosService>('EventosService', ['getEvento']);
    eventosService.getEvento.and.returnValue(respuesta$.asObservable());
    registroVisitaService = jasmine.createSpyObj<RegistroVisitaService>('RegistroVisitaService', ['programar']);
    registroVisitaService.programar.and.returnValue(() => undefined);

    await TestBed.configureTestingModule({
      imports: [EventoDetalle],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        { provide: EventosService, useValue: eventosService },
        { provide: RegistroVisitaService, useValue: registroVisitaService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventoDetalle);
    title = TestBed.inject(Title);
    fixture.detectChanges();
  });

  it('renderiza la información vigente y los chips sin datos redundantes', () => {
    respuesta$.next(crearEvento());
    fixture.detectChanges();

    const contenido = fixture.nativeElement.textContent as string;
    const aside = fixture.nativeElement.querySelector('aside') as HTMLElement;

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Torneo Apertura');
    expect(contenido).toContain('Primera fecha del circuito.');
    expect(contenido).toContain('Ajedrez VM');
    expect(contenido).toContain('Inicio');
    expect(contenido).toContain('Finaliza');
    expect(fixture.nativeElement.querySelector('.important-facts')).toBeNull();
    expect(contenido).not.toContain('Club Central');
    expect(contenido).not.toContain('Presencial');
    expect(aside.textContent).not.toContain('Etiquetas');
    expect(aside.getAttribute('aria-label')).toBe('Información del evento');
    expect(fixture.nativeElement.querySelector('.tag-list')?.textContent).toContain('#juvenil');
    expect(fixture.nativeElement.querySelector('.tag-list')?.textContent).toContain('#ritmo-rapido');
    expect(fixture.nativeElement.querySelector('main')).toBeNull();
  });

  it('mantiene HTML enriquecido extremo dentro del panel y conserva la sanitización de Angular', () => {
    const tokenLargo = 'https://example.com/' + 'ruta'.repeat(100);
    respuesta$.next(
      crearEvento({
        descripcionLarga: `<p>${'palabra'.repeat(100)}</p><a href="${tokenLargo}">${tokenLargo}</a><pre>${'codigo'.repeat(100)}</pre><table><tr><td>${tokenLargo}</td></tr></table><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" onerror="alert(1)"><video></video><script>alert('x')</script>`,
      }),
    );
    fixture.detectChanges();

    const contenido = fixture.nativeElement.querySelector('.event-rich-text') as HTMLElement;
    const pre = contenido.querySelector('pre') as HTMLElement;
    const tabla = contenido.querySelector('table') as HTMLTableElement;
    const imagen = contenido.querySelector('img') as HTMLImageElement;
    const video = contenido.querySelector('video') as HTMLVideoElement;

    expect(contenido.classList).toContain('ql-editor');
    expect(contenido.querySelector('a')?.textContent).toContain('https://example.com/');
    expect(pre.textContent).toContain('codigo');
    expect(tabla).not.toBeNull();
    expect(contenido.querySelector('script')).toBeNull();
    expect(contenido.querySelector('img')?.hasAttribute('onerror')).toBeFalse();
    expect(getComputedStyle(contenido).maxWidth).toBe('100%');
    expect(getComputedStyle(contenido).overflowWrap).toBe('anywhere');
    expect(getComputedStyle(contenido).wordBreak).toBe('break-word');
    expect(getComputedStyle(pre).whiteSpace).toBe('pre-wrap');
    expect(getComputedStyle(tabla).maxWidth).toBe('100%');
    expect(getComputedStyle(tabla).overflowX).toBe('auto');
    expect(getComputedStyle(imagen).maxWidth).toBe('100%');
    expect(getComputedStyle(video).maxWidth).toBe('100%');
  });

  it('muestra el afiche completo sin recortarlo', () => {
    respuesta$.next(crearEvento());
    fixture.detectChanges();

    const contenedor = fixture.nativeElement.querySelector('.event-intro__visual') as HTMLElement;
    const boton = fixture.nativeElement.querySelector('.event-intro__image-button') as HTMLButtonElement;
    const afiche = boton.querySelector('img') as HTMLImageElement;

    expect(afiche).not.toBeNull();
    expect(getComputedStyle(afiche).objectFit).toBe('contain');
    expect(getComputedStyle(afiche).maxWidth).toBe('100%');
    expect(getComputedStyle(afiche).maxHeight).toBe('416px');
    expect(getComputedStyle(contenedor).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(getComputedStyle(boton).cursor).toBe('zoom-in');
    expect(boton.getAttribute('aria-label')).toBe('Ampliar afiche de Torneo Apertura');
    expect(boton.querySelector('.event-intro__zoom')).not.toBeNull();
  });

  it('amplía el afiche en un diálogo modal y permite cerrarlo', () => {
    respuesta$.next(crearEvento());
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector('.event-intro__image-button') as HTMLButtonElement;
    const dialog = fixture.nativeElement.querySelector('.image-lightbox') as HTMLDialogElement;

    boton.click();
    fixture.detectChanges();

    expect(dialog.open).toBeTrue();
    expect(dialog.getAttribute('aria-label')).toBe('Afiche ampliado de Torneo Apertura');
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(crearEvento().imagenUrl);

    (dialog.querySelector('.image-lightbox__close') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(dialog.open).toBeFalse();
  });

  it('cierra el afiche al pulsar fuera de la imagen', () => {
    respuesta$.next(crearEvento());
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector('.event-intro__image-button') as HTMLButtonElement;
    const dialog = fixture.nativeElement.querySelector('.image-lightbox') as HTMLDialogElement;
    const contenido = dialog.querySelector('.image-lightbox__content') as HTMLElement;
    const imagen = dialog.querySelector('img') as HTMLImageElement;

    boton.click();
    imagen.click();
    expect(dialog.open).toBeTrue();

    contenido.click();
    expect(dialog.open).toBeFalse();
  });

  it('anuncia la carga y luego usa el título del evento', () => {
    const carga = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;

    expect(carga.textContent).toContain('Cargando detalle del evento');
    expect(carga.getAttribute('aria-live')).toBe('polite');
    expect(title.getTitle()).toBe('Ajedrez VM');

    respuesta$.next(crearEvento({ titulo: 'Abierto de Invierno' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(title.getTitle()).toBe('Abierto de Invierno | Ajedrez VM');
  });

  it('muestra compartir bajo la descripción y publica metadatos del evento', () => {
    respuesta$.next(crearEvento());
    fixture.detectChanges();

    const description = fixture.nativeElement.querySelector('.event-intro__content > p');
    const share = fixture.nativeElement.querySelector('app-compartir-evento');
    const shareDialog = share.querySelector('.share-dialog') as HTMLDialogElement;
    const canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement;

    expect(description.nextElementSibling).toBe(share);
    expect(share.querySelector('.share-trigger').textContent).toContain('Compartir');
    expect(shareDialog.open).toBeFalse();
    expect(document.head.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'Primera fecha del circuito.',
    );
    expect(document.head.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Torneo Apertura | Ajedrez VM',
    );
    expect(document.head.querySelector('meta[property="og:image"]')?.getAttribute('content')).toContain(
      '/api/uploads/imagen',
    );
    expect(document.head.querySelector('meta[property="og:image:alt"]')?.getAttribute('content')).toBe(
      'Afiche principal de Torneo Apertura',
    );
    expect(document.head.querySelector('meta[property="og:image:width"]')).toBeNull();
    expect(document.head.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe(
      'summary_large_image',
    );
    expect(new URL(canonical.href).pathname).toBe('/eventos/torneo-apertura');
  });

  it('anuncia el error y conserva un título seguro', () => {
    respuesta$.error(new Error('No encontrado'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudo cargar este evento',
    );
    expect(title.getTitle()).toBe('Ajedrez VM');
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull();
  });

  it('programa una visita después de una carga exitosa', () => {
    expect(registroVisitaService.programar).not.toHaveBeenCalled();

    respuesta$.next(crearEvento());
    fixture.detectChanges();

    expect(registroVisitaService.programar).toHaveBeenCalledOnceWith('torneo-apertura');
  });

  it('mantiene el evento visible aunque el registro quede programado como operación secundaria', () => {
    registroVisitaService.programar.and.throwError('No se pudo programar');
    respuesta$.next(crearEvento());
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Torneo Apertura');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('restablece el error al navegar de un slug inválido a uno válido', () => {
    eventosService.getEvento.and.callFake((slug: string): Observable<Evento> =>
      slug === 'invalido'
        ? throwError(() => new Error('No encontrado'))
        : of(crearEvento({ slug, titulo: 'Evento recuperado' })),
    );

    paramMap$.next(convertToParamMap({ slug: 'invalido' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();

    paramMap$.next(convertToParamMap({ slug: 'valido' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Evento recuperado');
    expect(title.getTitle()).toBe('Evento recuperado | Ajedrez VM');
  });

  it('oculta el evento anterior y muestra carga mientras responde un nuevo slug', () => {
    const respuestaB$ = new Subject<Evento>();
    eventosService.getEvento.and.callFake((slug: string) =>
      slug === 'evento-b' ? respuestaB$.asObservable() : respuesta$.asObservable(),
    );
    respuesta$.next(crearEvento({ slug: 'evento-a', titulo: 'Evento A' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Evento A');

    paramMap$.next(convertToParamMap({ slug: 'evento-b' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('h1')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Evento A');
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      'Cargando detalle del evento',
    );

    respuestaB$.next(crearEvento({ slug: 'evento-b', titulo: 'Evento B' }));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Evento B');
  });

  it('abre enlaces externos y documentos de forma segura en otra pestaña', () => {
    respuesta$.next(crearEvento());
    fixture.detectChanges();

    const enlaces = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-links__list a'),
    ) as HTMLAnchorElement[];

    expect(enlaces.length).toBe(2);
    for (const enlace of enlaces) {
      expect(enlace.target).toBe('_blank');
      expect(enlace.rel).toContain('noopener');
      expect(enlace.rel).toContain('noreferrer');
    }
    expect(enlaces[0].textContent).toContain('Ver más');
    expect(enlaces[0].textContent).toContain('(abre en una pestaña nueva)');
    expect(enlaces[1].textContent).toContain('Bases.pdf');
    expect(enlaces[1].textContent).toContain('Abrir');
    expect(enlaces[1].textContent).toContain('(abre en una pestaña nueva)');
    expect(enlaces[0].querySelector('.visually-hidden')).not.toBeNull();
    expect(enlaces[1].querySelector('.visually-hidden')).not.toBeNull();
    expect(enlaces[1].querySelectorAll('[aria-hidden="true"]').length).toBe(2);
  });
});
