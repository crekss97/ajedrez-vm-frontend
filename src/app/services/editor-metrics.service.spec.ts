import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { diasEntreFechasBuenosAires } from '../core/fechas-buenos-aires';
import { EditorMetricsService } from './editor-metrics.service';

describe('EditorMetricsService', () => {
  let service: EditorMetricsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EditorMetricsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('consulta el resumen editorial con el rango local solicitado', () => {
    const range = { desde: '2026-07-01', hasta: '2026-07-07' };

    service.getMetrics(range).subscribe();

    const request = httpTesting.expectOne((candidate) => candidate.url.endsWith('/editor/visitas/resumen'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('desde')).toBe(range.desde);
    expect(request.request.params.get('hasta')).toBe(range.hasta);
    request.flush({});
  });

  it('genera por defecto los últimos 30 días inclusivos de Buenos Aires', () => {
    const range = service.getDefaultRange();

    expect(diasEntreFechasBuenosAires(range.desde, range.hasta)).toBe(30);
  });
});
