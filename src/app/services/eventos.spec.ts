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
    service.registrarConsulta('torneo-apertura').subscribe();

    const request = httpTesting.expectOne('/api/events/torneo-apertura/view');
    expect(request.request.context.get(OMITIR_CARGADOR_GLOBAL)).toBeTrue();
    expect(loading.cargando()).toBeFalse();

    request.flush({ views: 13 });
  });
});
