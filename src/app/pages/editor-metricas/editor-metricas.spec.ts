import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditorMetricas } from './editor-metricas';

describe('EditorMetricas', () => {
  let fixture: ComponentFixture<EditorMetricas>;
  let httpTesting: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorMetricas],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorMetricas);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpTesting.verify());

  it('muestra vistas, visitantes únicos y una tabla accesible por evento', () => {
    const request = httpTesting.expectOne((candidate) => candidate.url.endsWith('/editor/visitas/resumen'));
    request.flush({
      desde: '2026-07-01',
      hasta: '2026-07-02',
      dias: 2,
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      totalEvents: 2,
      publishedEvents: 1,
      draftEvents: 1,
      featuredEvents: 1,
      totalViews: 4,
      uniqueViews: 3,
      averageViews: 2,
      viewsByDay: [
        { fecha: '2026-07-01', views: 3, uniqueViews: 2 },
        { fecha: '2026-07-02', views: 1, uniqueViews: 1 },
      ],
      eventsByViews: [{
        id: 1,
        titulo: 'Torneo Apertura',
        estadoEditorial: 'published',
        views: 4,
        uniqueViews: 3,
      }],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Vistas del período');
    expect(fixture.nativeElement.textContent).toContain('Visitantes únicos');
    expect(fixture.nativeElement.textContent).toContain('Torneo Apertura');
    expect(fixture.nativeElement.querySelector('table')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('canvas[role="img"]').length).toBe(3);
  });

  it('muestra un error recuperable cuando falla el endpoint editorial', () => {
    const request = httpTesting.expectOne((candidate) => candidate.url.endsWith('/editor/visitas/resumen'));
    request.flush({ message: 'fallo' }, { status: 503, statusText: 'Service Unavailable' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('No se pudieron');
    expect(fixture.nativeElement.querySelector('.metrics-error-card button')).not.toBeNull();
  });

  it('bloquea períodos mayores a 90 días antes de consultar', () => {
    const request = httpTesting.expectOne((candidate) => candidate.url.endsWith('/editor/visitas/resumen'));
    request.flush({
      desde: '2026-07-01',
      hasta: '2026-07-01',
      dias: 1,
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      totalEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      featuredEvents: 0,
      totalViews: 0,
      uniqueViews: 0,
      averageViews: 0,
      viewsByDay: [],
      eventsByViews: [],
    });
    fixture.detectChanges();

    const desde = fixture.nativeElement.querySelector('#metricas-desde') as HTMLInputElement;
    const hasta = fixture.nativeElement.querySelector('#metricas-hasta') as HTMLInputElement;
    desde.value = '2020-01-01';
    hasta.value = '2026-07-01';
    desde.dispatchEvent(new Event('input'));
    hasta.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.metrics-error')?.textContent).toContain('90 días');
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    httpTesting.expectNone((candidate) => candidate.url.endsWith('/editor/visitas/resumen'));
  });
});
