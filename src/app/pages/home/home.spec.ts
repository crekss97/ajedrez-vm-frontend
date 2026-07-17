import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Evento } from '../../models/evento';
import { SidebarLink } from '../../models/sidebar-link';
import { EventosService } from '../../services/evento.service';
import { SidebarLinksService } from '../../services/sidebar-links.service';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let eventosService: jasmine.SpyObj<EventosService>;
  let sidebarLinksService: jasmine.SpyObj<SidebarLinksService>;
  let eventos$: Subject<Evento[]>;
  let links$: Subject<SidebarLink[]>;

  const crearEvento = (valores: Partial<Evento> = {}): Evento => ({
    id: 1,
    slug: 'torneo-apertura',
    titulo: 'Torneo Apertura',
    categoria: 'Torneo',
    descripcionCorta: 'Primera fecha del circuito.',
    descripcionLarga: '<p>Primera fecha del circuito.</p>',
    fechaInicio: '2026-08-10T18:00:00.000Z',
    ubicacion: 'Club Central',
    organizador: 'Ajedrez VM',
    imagenUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=',
    destacado: true,
    modalidad: 'Presencial',
    precio: 'Gratis',
    tags: [],
    views: 12,
    estadoEditorial: 'published',
    ...valores,
  });

  beforeEach(async () => {
    eventos$ = new Subject<Evento[]>();
    links$ = new Subject<SidebarLink[]>();
    eventosService = jasmine.createSpyObj<EventosService>('EventosService', [
      'getEventos',
      'getEventosPopulares',
    ]);
    sidebarLinksService = jasmine.createSpyObj<SidebarLinksService>('SidebarLinksService', [
      'getLinks',
    ]);
    eventosService.getEventos.and.returnValue(eventos$.asObservable());
    sidebarLinksService.getLinks.and.returnValue(links$.asObservable());

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: EventosService, useValue: eventosService },
        { provide: SidebarLinksService, useValue: sidebarLinksService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  });

  it('muestra esqueletos sin anunciar estados vacios mientras carga', () => {
    const contenido = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelectorAll('[role="status"]').length).toBe(4);
    expect(contenido).not.toContain('Todavia no hay eventos publicados');
    expect(contenido).not.toContain('Aun no hay consultas registradas');
  });

  it('muestra el estado vacio solo despues de una respuesta exitosa sin eventos', () => {
    eventos$.next([]);
    links$.next([]);
    fixture.detectChanges();

    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('Todavia no hay eventos publicados');
    expect(contenido).toContain('Aun no hay consultas registradas');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('carga eventos una sola vez y deriva los populares por cantidad de consultas', () => {
    eventos$.next([
      crearEvento({ id: 1, slug: 'menos-visto', titulo: 'Menos visto', views: 2 }),
      crearEvento({ id: 2, slug: 'mas-visto', titulo: 'Mas visto', views: 30 }),
    ]);
    links$.next([]);
    fixture.detectChanges();

    const titulosPopulares = Array.from(
      fixture.nativeElement.querySelectorAll('.popular-card h3') as NodeListOf<HTMLElement>,
    ).map((elemento) => elemento.textContent?.trim());

    expect(eventosService.getEventos).toHaveBeenCalledTimes(1);
    expect(eventosService.getEventosPopulares).not.toHaveBeenCalled();
    expect(titulosPopulares).toEqual(['Mas visto', 'Menos visto']);
  });

  it('mantiene los eventos visibles cuando falla la carga de links', () => {
    eventos$.next([crearEvento()]);
    links$.error(new Error('No disponible'));
    fixture.detectChanges();

    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('Torneo Apertura');
    expect(contenido).toContain('No se pudieron cargar los accesos rapidos');
    expect(contenido).not.toContain('No se pudieron cargar los eventos.');
  });

  it('mantiene los links visibles cuando falla la carga de eventos', () => {
    eventos$.error(new Error('No disponible'));
    links$.next([
      {
        id: '1',
        titulo: 'Federacion regional',
        url: 'https://example.com',
        createdAt: '2026-07-17T00:00:00.000Z',
      },
    ]);
    fixture.detectChanges();

    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('Federacion regional');
    expect(contenido).toContain('No se pudieron cargar los eventos.');
    expect(contenido).toContain('Agenda no disponible');
    expect(contenido).not.toContain('0 eventos');
    expect(contenido).not.toContain('No se pudieron cargar los accesos rapidos');
  });
});
