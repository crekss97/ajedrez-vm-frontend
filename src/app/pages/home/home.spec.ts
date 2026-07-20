import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { Evento } from '../../models/evento';
import { SidebarLink } from '../../models/sidebar-link';
import { PuzzleDiario } from '../../models/puzzle-diario';
import { EventosService } from '../../services/evento.service';
import { PuzzleDiarioService } from '../../services/puzzle-diario.service';
import { SidebarLinksService } from '../../services/sidebar-links.service';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let eventosService: jasmine.SpyObj<EventosService>;
  let sidebarLinksService: jasmine.SpyObj<SidebarLinksService>;
  let puzzleDiarioService: jasmine.SpyObj<PuzzleDiarioService>;
  let eventos$: Subject<Evento[]>;
  let links$: Subject<SidebarLink[]>;
  let puzzle$: Subject<PuzzleDiario>;

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
    tags: [],
    views: 12,
    estadoEditorial: 'published',
    ...valores,
  });

  beforeEach(async () => {
    eventos$ = new Subject<Evento[]>();
    links$ = new Subject<SidebarLink[]>();
    puzzle$ = new Subject<PuzzleDiario>();
    eventosService = jasmine.createSpyObj<EventosService>('EventosService', ['getEventos']);
    sidebarLinksService = jasmine.createSpyObj<SidebarLinksService>('SidebarLinksService', [
      'getLinks',
    ]);
    puzzleDiarioService = jasmine.createSpyObj<PuzzleDiarioService>('PuzzleDiarioService', [
      'getPuzzleDiario',
    ]);
    eventosService.getEventos.and.returnValue(eventos$.asObservable());
    sidebarLinksService.getLinks.and.returnValue(links$.asObservable());
    puzzleDiarioService.getPuzzleDiario.and.returnValue(puzzle$.asObservable());

    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: EventosService, useValue: eventosService },
        { provide: SidebarLinksService, useValue: sidebarLinksService },
        { provide: PuzzleDiarioService, useValue: puzzleDiarioService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
  });

  it('espera la respuesta sin mostrar loaders locales ni estados vacios', () => {
    const contenido = fixture.nativeElement.textContent as string;

    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.chess-loader__board')).toBeNull();
    expect(fixture.nativeElement.querySelector('.featured-carousel')).toBeNull();
    expect(contenido).not.toContain('Todavia no hay eventos publicados');
    expect(contenido).not.toContain('Entradas populares');
  });

  it('muestra el estado vacio solo despues de una respuesta exitosa sin eventos', () => {
    eventos$.next([]);
    links$.next([]);
    fixture.detectChanges();

    const contenido = fixture.nativeElement.textContent as string;
    expect(contenido).toContain('Todavia no hay eventos publicados');
    expect(contenido).toContain('No hay enlaces destacados por el momento');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('carga eventos una sola vez y no presenta entradas populares', () => {
    eventos$.next([
      crearEvento({ id: 1, slug: 'menos-visto', titulo: 'Menos visto', views: 2 }),
      crearEvento({ id: 2, slug: 'mas-visto', titulo: 'Mas visto', views: 30 }),
    ]);
    links$.next([]);
    fixture.detectChanges();

    expect(eventosService.getEventos).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).not.toContain('Entradas populares');
    expect(fixture.nativeElement.textContent).not.toContain('30 visitas');
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

  it('muestra la cartelera y el afiche destacado separado de su informacion', () => {
    eventos$.next([crearEvento()]);
    links$.next([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.event-card')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.featured-poster')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.featured-details h1')?.textContent).toContain(
      'Torneo Apertura',
    );
    expect(fixture.nativeElement.querySelector('.featured-stage__ambient')?.getAttribute('aria-hidden')).toBe(
      'true',
    );
  });

  it('mantiene el puzzle visible cuando fallan los links', () => {
    eventos$.next([]);
    links$.error(new Error('No disponible'));
    puzzle$.next({
      id: 'puzzle-1',
      fen: '8/8/8/8/8/8/4K3/6k1 w - - 0 1',
      ultimoMovimiento: 'g2g1',
      solucion: ['e2e3'],
      rating: 1200,
      temas: [],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los accesos rapidos');
    expect(fixture.nativeElement.querySelector('.puzzle-board')).not.toBeNull();
  });

  it('mantiene los links visibles cuando falla el puzzle', () => {
    eventos$.next([]);
    links$.next([
      { id: '1', titulo: 'Federacion regional', url: 'https://example.com', createdAt: '' },
    ]);
    puzzle$.error(new Error('No disponible'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Federacion regional');
    expect(fixture.nativeElement.textContent).toContain('El puzzle no esta disponible');
  });

  it('integra eventos, enlaces y puzzle dentro de un unico aside sin populares', () => {
    eventos$.next([crearEvento()]);
    links$.next([
      { id: '1', titulo: 'Federacion regional', url: 'https://example.com', createdAt: '' },
    ]);
    puzzle$.next({
      id: 'puzzle-1',
      fen: '8/8/8/8/8/8/4K3/6k1 w - - 0 1',
      ultimoMovimiento: 'g2g1',
      solucion: ['e2e3'],
      rating: 1200,
      temas: [],
    });
    fixture.detectChanges();

    const asides = fixture.nativeElement.querySelectorAll('aside');
    expect(asides.length).toBe(1);
    expect(asides[0].textContent).toContain('Federacion regional');
    expect(asides[0].querySelector('.puzzle-board')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.featured-carousel')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.event-card')).not.toBeNull();
    expect(asides[0].textContent).not.toContain('Entradas populares');
    expect(asides[0].textContent).not.toContain('visitas');
  });

  it('navega manualmente entre destacados y anuncia el actual', () => {
    eventos$.next([
      crearEvento({ id: 1, slug: 'primero', titulo: 'Primer destacado' }),
      crearEvento({ id: 2, slug: 'segundo', titulo: 'Segundo destacado' }),
    ]);
    links$.next([]);
    fixture.detectChanges();

    const next = fixture.nativeElement.querySelector(
      '[aria-label="Ver siguiente evento destacado"]',
    ) as HTMLButtonElement;
    next.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.featured-details h1')?.textContent).toContain(
      'Segundo destacado',
    );
    expect(fixture.nativeElement.querySelectorAll('.carousel-dot')[1].getAttribute('aria-current')).toBe(
      'true',
    );
    expect(fixture.nativeElement.querySelector('[aria-live="polite"]')?.textContent).toContain(
      'Segundo destacado. Destacado 2 de 2.',
    );
  });

  it('no rota los destacados automaticamente', fakeAsync(() => {
    eventos$.next([
      crearEvento({ id: 1, slug: 'primero', titulo: 'Primer destacado' }),
      crearEvento({ id: 2, slug: 'segundo', titulo: 'Segundo destacado' }),
    ]);
    links$.next([]);
    fixture.detectChanges();

    tick(12000);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.featured-details h1')?.textContent).toContain(
      'Primer destacado',
    );
  }));

  it('muestra un fallback cuando falla el afiche destacado', () => {
    eventos$.next([crearEvento()]);
    links$.next([]);
    fixture.detectChanges();

    const poster = fixture.nativeElement.querySelector('.featured-poster img') as HTMLImageElement;
    poster.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.featured-poster__fallback')?.textContent).toContain(
      'Torneo Apertura',
    );
  });
});
