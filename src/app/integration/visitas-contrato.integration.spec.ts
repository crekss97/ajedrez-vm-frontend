import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Evento } from '../models/evento';
import { apiCredentialsInterceptor } from '../core/interceptors/api-credentials.interceptor';
import { appLoadingInterceptor } from '../core/interceptors/app-loading.interceptor';
import { EventoDetalle } from '../pages/evento-detalle/evento-detalle';

describe('Contrato integrado de visitas', () => {
  let fixture: ComponentFixture<EventoDetalle>;
  let httpTesting: HttpTestingController;
  let paramMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    localStorage.removeItem('ajedrez-vm:visitor-id:v1');
    sessionStorage.removeItem('ajedrez-vm:event-view:v1:torneo-apertura');
    paramMap$ = new BehaviorSubject(convertToParamMap({ slug: 'torneo-apertura' }));

    await TestBed.configureTestingModule({
      imports: [EventoDetalle],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: paramMap$.asObservable() } },
        provideHttpClient(withInterceptors([appLoadingInterceptor, apiCredentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EventoDetalle);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture.destroy();
    httpTesting.verify();
    localStorage.removeItem('ajedrez-vm:visitor-id:v1');
    sessionStorage.removeItem('ajedrez-vm:event-view:v1:torneo-apertura');
  });

  it('recorre detalle, visibilidad y registro HTTP con credenciales', fakeAsync(() => {
    fixture.detectChanges();

    const detailRequest = httpTesting.expectOne('/api/events/torneo-apertura');
    expect(detailRequest.request.withCredentials).toBeTrue();
    detailRequest.flush(crearEvento());
    fixture.detectChanges();

    tick(2_999);
    httpTesting.expectNone('/api/events/torneo-apertura/view');

    tick(1);
    const viewRequest = httpTesting.expectOne('/api/events/torneo-apertura/view');
    expect(viewRequest.request.withCredentials).toBeTrue();
    expect(viewRequest.request.headers.get('Idempotency-Key')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(viewRequest.request.body.visibleDurationMs).toBeGreaterThanOrEqual(3_000);
    expect(viewRequest.request.body.visitorId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    viewRequest.flush({ views: 1 });
    tick();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toContain('Torneo Apertura');
  }));
});

function crearEvento(): Evento {
  return {
    id: 70,
    slug: 'torneo-apertura',
    titulo: 'Torneo Apertura',
    categoria: 'Torneo',
    descripcionCorta: 'Evento de contrato',
    descripcionLarga: '<p>Contenido del evento.</p>',
    fechaInicio: '2026-08-10T18:00:00.000Z',
    ubicacion: 'Remoto',
    organizador: 'Ajedrez VM',
    imagenUrl: '/api/uploads/imagen',
    destacado: false,
    modalidad: 'Online',
    tags: ['integracion'],
    views: 0,
    linksExternos: [],
    adjuntos: [],
    estadoEditorial: 'published',
  };
}
