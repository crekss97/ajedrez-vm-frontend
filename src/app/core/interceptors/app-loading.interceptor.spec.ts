import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppLoadingService } from '../app-loading.service';
import { appLoadingInterceptor, OMITIR_CARGADOR_GLOBAL } from './app-loading.interceptor';

describe('appLoadingInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let loading: AppLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([appLoadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(AppLoadingService);
  });

  afterEach(() => httpTesting.verify());

  it('mantiene la carga activa hasta completar todas las requests', () => {
    http.get('/api/events').subscribe();
    http.get('/api/sidebar-links').subscribe();

    expect(loading.cargando()).toBeTrue();

    httpTesting.expectOne('/api/events').flush([]);
    expect(loading.cargando()).toBeTrue();

    httpTesting.expectOne('/api/sidebar-links').flush([]);
    expect(loading.cargando()).toBeFalse();
  });

  it('finaliza la carga cuando una request falla', () => {
    http.get('/api/events').subscribe({ error: () => undefined });

    httpTesting.expectOne('/api/events').flush(
      {},
      { status: 500, statusText: 'Server Error' },
    );

    expect(loading.cargando()).toBeFalse();
  });

  it('omite las requests marcadas como secundarias', () => {
    const context = new HttpContext().set(OMITIR_CARGADOR_GLOBAL, true);
    http.post('/api/events/torneo/view', {}, { context }).subscribe();

    expect(loading.cargando()).toBeFalse();
    httpTesting.expectOne('/api/events/torneo/view').flush({ views: 1 });
  });

  it('finaliza la carga al cancelar una request', () => {
    const subscription = http.get('/api/events').subscribe();
    const request = httpTesting.expectOne('/api/events');

    expect(loading.cargando()).toBeTrue();
    subscription.unsubscribe();

    expect(request.cancelled).toBeTrue();
    expect(loading.cargando()).toBeFalse();
  });
});
