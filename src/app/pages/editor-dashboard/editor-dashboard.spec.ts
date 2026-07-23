import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventoEditorDraft } from '../../models/editor';
import { EditorEventosService } from '../../services/editor-eventos.service';
import { EditorMetricsService } from '../../services/editor-metrics.service';
import { EditorDashboard } from './editor-dashboard';

describe('EditorDashboard', () => {
  let fixture: ComponentFixture<EditorDashboard>;
  let eventosService: jasmine.SpyObj<EditorEventosService>;
  let metricsService: jasmine.SpyObj<EditorMetricsService>;

  const crearEvento = (valores: Partial<EventoEditorDraft> = {}): EventoEditorDraft => ({
    id: 1,
    slug: 'torneo-apertura',
    titulo: 'Torneo Apertura',
    categoria: 'Torneo',
    descripcionCorta: 'Primera fecha del circuito.',
    descripcionLarga: '<p>Primera fecha del circuito.</p>',
    fechaInicio: '2026-08-10T18:00:00.000Z',
    ubicacion: 'Club Central',
    organizador: 'Ajedrez VM',
    imagenUrl: '/api/uploads/1',
    destacado: false,
    modalidad: 'Presencial',
    tags: [],
    views: 12,
    linksExternos: [],
    adjuntos: [],
    estadoEditorial: 'published',
    fuente: 'editor',
    creadoPor: 'editor@ajedrezvm.com',
    actualizadoEn: '2026-07-20T00:00:00.000Z',
    ...valores,
  });

  beforeEach(async () => {
    const eventos = [
      crearEvento({ id: 1, titulo: 'Evento destacado', destacado: true }),
      crearEvento({ id: 2, titulo: 'Evento común', destacado: false, estadoEditorial: 'draft' }),
    ];
    eventosService = jasmine.createSpyObj<EditorEventosService>('EditorEventosService', [], {
      drafts$: of(eventos),
    });
    metricsService = jasmine.createSpyObj<EditorMetricsService>('EditorMetricsService', ['getMetrics']);
    metricsService.getMetrics.and.returnValue(of({
       desde: '2026-07-01',
       hasta: '2026-07-30',
       dias: 30,
       zonaHoraria: 'America/Argentina/Buenos_Aires',
       totalEvents: 2,
       publishedEvents: 1,
       draftEvents: 1,
       featuredEvents: 1,
       totalViews: 12,
       uniqueViews: 4,
       averageViews: 6,
       viewsByDay: [],
       eventsByViews: [],
    }));

    await TestBed.configureTestingModule({
      imports: [EditorDashboard],
      providers: [
        provideRouter([]),
        { provide: EditorEventosService, useValue: eventosService },
        { provide: EditorMetricsService, useValue: metricsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorDashboard);
    fixture.detectChanges();
  });

  it('muestra el sello solo en los eventos destacados del resumen', () => {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('.activity-item')) as HTMLElement[];

    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('.editor-featured-badge')?.textContent).toContain('Destacado');
    expect(rows[1].querySelector('.editor-featured-badge')).toBeNull();
    expect(rows[0].querySelector('.activity-item__status')?.textContent).toContain('Publicado');
    expect(rows[1].querySelector('.activity-item__status')?.textContent).toContain('Borrador');
  });
});
