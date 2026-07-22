import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { EventoEditorDraft } from '../../models/editor';
import { EditorEventosService } from '../../services/editor-eventos.service';
import { EditorEventosBiblioteca } from './editor-eventos-biblioteca';

describe('EditorEventosBiblioteca', () => {
  let fixture: ComponentFixture<EditorEventosBiblioteca>;
  let service: jasmine.SpyObj<EditorEventosService>;

  const publicado: EventoEditorDraft = {
    id: 1,
    slug: 'torneo-publicado',
    titulo: 'Torneo publicado',
    categoria: 'Torneo',
    descripcionCorta: 'Evento disponible para toda la comunidad.',
    descripcionLarga: '<p>Detalle</p>',
    fechaInicio: '2026-08-10T21:00:00.000Z',
    ubicacion: 'Club Central',
    organizador: 'Ajedrez VM',
    imagenUrl: '/api/uploads/1',
    destacado: true,
    modalidad: 'Presencial',
    tags: [],
    views: 4,
    linksExternos: [],
    adjuntos: [],
    estadoEditorial: 'published',
    fuente: 'editor',
    creadoPor: 'editor@ajedrezvm.com',
    actualizadoEn: '2026-07-20T00:00:00.000Z',
  };
  const borrador: EventoEditorDraft = {
    ...publicado,
    id: 2,
    slug: 'torneo-borrador',
    titulo: 'Torneo borrador',
    destacado: false,
    estadoEditorial: 'draft',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<EditorEventosService>(
      'EditorEventosService',
      ['deleteEvent'],
      { drafts$: of([publicado, borrador]) },
    );
    service.deleteEvent.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [EditorEventosBiblioteca],
      providers: [provideRouter([]), { provide: EditorEventosService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(EditorEventosBiblioteca);
    fixture.detectChanges();
  });

  it('identifica destacados y conserva las acciones editoriales', () => {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('.event-row')) as HTMLElement[];
    const publishedActions = rows[0].querySelector('.event-row__actions') as HTMLElement;
    const draftActions = rows[1].querySelector('.event-row__actions') as HTMLElement;

    expect(rows.length).toBe(2);
    expect(rows[0].querySelector('.editor-featured-badge')).not.toBeNull();
    expect(rows[1].querySelector('.editor-featured-badge')).toBeNull();
    expect(publishedActions.querySelector('app-compartir-evento')).not.toBeNull();
    expect(draftActions.querySelector('app-compartir-evento')).toBeNull();
    for (const actions of [publishedActions, draftActions]) {
      expect(
        Array.from(actions.children).some(
          (child) => child.tagName === 'A' && child.textContent?.includes('Editar'),
        ),
      ).toBeTrue();
      expect(Array.from(actions.children).some((child) => child.textContent?.includes('Eliminar'))).toBeTrue();
    }
  });
});
