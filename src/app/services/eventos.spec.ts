import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppLoadingService } from '../core/app-loading.service';
import {
  appLoadingInterceptor,
  OMITIR_CARGADOR_GLOBAL,
} from '../core/interceptors/app-loading.interceptor';
import { EventosService } from './evento.service';

describe('EventosService', () => {
  let service: EventosService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([appLoadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(EventosService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('se crea correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('registra consultas sin activar el cargador global', () => {
    const loading = TestBed.inject(AppLoadingService);
    service.registrarConsulta(
      'torneo-apertura',
      3_000,
      '550e8400-e29b-41d4-a716-446655440000',
      '550e8400-e29b-41d4-a716-446655440001',
    ).subscribe();

    const request = httpTesting.expectOne('/api/events/torneo-apertura/view');
    expect(request.request.context.get(OMITIR_CARGADOR_GLOBAL)).toBeTrue();
    expect(request.request.headers.get('Idempotency-Key')).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(request.request.body).toEqual({
      visitorId: '550e8400-e29b-41d4-a716-446655440000',
      visibleDurationMs: 3_000,
    });
    expect(loading.cargando()).toBeFalse();

    request.flush({ views: 13 });
  });

  it('obtiene un evento por su endpoint directo y normaliza sus medios', () => {
    let resultado: any;
    service.getEvento('abierto / verano').subscribe((event) => (resultado = event));

    const request = httpTesting.expectOne('/api/events/abierto%20%2F%20verano');
    request.flush({
      id: 7,
      slug: 'abierto-verano',
      titulo: 'Abierto de verano',
      imagenUrl: '/api/uploads/imagen',
      adjuntos: [{ id: '1', nombre: 'Bases', url: '/api/uploads/bases', tipo: 'application/pdf' }],
    });

    expect(resultado.fuente).toBe('api');
    expect(resultado.estadoEditorial).toBe('published');
    expect(resultado.linksExternos).toEqual([]);
    expect(resultado.imagenUrl).toBe(`${window.location.origin}/api/uploads/imagen`);
    expect(resultado.adjuntos[0].url).toBe(`${window.location.origin}/api/uploads/bases`);
  });
});
