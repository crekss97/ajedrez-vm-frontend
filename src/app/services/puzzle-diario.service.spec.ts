import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AppLoadingService } from '../core/app-loading.service';
import {
  OMITIR_CARGADOR_GLOBAL,
  appLoadingInterceptor,
} from '../core/interceptors/app-loading.interceptor';
import { PuzzleDiarioService } from './puzzle-diario.service';

describe('PuzzleDiarioService', () => {
  let service: PuzzleDiarioService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([appLoadingInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(PuzzleDiarioService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('consulta el puzzle diario sin activar el cargador global', () => {
    service.getPuzzleDiario().subscribe();

    const request = httpTesting.expectOne('/api/puzzles/daily');
    const loading = TestBed.inject(AppLoadingService);
    expect(request.request.method).toBe('GET');
    expect(request.request.context.get(OMITIR_CARGADOR_GLOBAL)).toBeTrue();
    expect(loading.cargando()).toBeFalse();
    request.flush({
      id: 'puzzle-1',
      fen: '8/8/8/8/8/8/4K3/6k1 w - - 0 1',
      ultimoMovimiento: 'g2g1',
      solucion: ['e2e3'],
      rating: 1200,
      temas: [],
    });
  });
});
