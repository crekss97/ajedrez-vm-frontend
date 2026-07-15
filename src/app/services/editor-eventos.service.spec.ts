import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { EventoEditorInput } from '../models/editor';
import { EditorEventosService } from './editor-eventos.service';

describe('EditorEventosService', () => {
  let service: EditorEventosService;
  let httpTesting: HttpTestingController;

  const input: EventoEditorInput = {
    titulo: 'Evento multipart',
    categoria: 'Torneo',
    descripcionCorta: 'Descripción suficientemente completa',
    descripcionLarga: '<p>Descripción larga.</p>',
    fechaInicio: '2026-12-01T10:00',
    ubicacion: 'Remoto',
    organizador: 'Ajedrez VM',
    imagenUrl: '',
    destacado: false,
    modalidad: 'Online',
    precio: 'Gratis',
    tags: ['prueba'],
    linksExternos: [],
    adjuntos: [],
    estadoEditorial: 'draft',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(EditorEventosService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('envía evento, imagen y PDF en un único multipart', () => {
    const image = new File(['imagen'], 'portada.jpg', { type: 'image/jpeg' });
    const pdf = new File(['%PDF-1.7'], 'bases.pdf', { type: 'application/pdf' });

    service.createEvent(input, 'editor@ajedrezvm.com', image, [pdf]).subscribe();

    const request = httpTesting.expectOne((candidate) => candidate.url.endsWith('/events'));
    const formData = request.request.body as FormData;
    const eventData = JSON.parse(String(formData.get('evento')));
    expect(request.request.method).toBe('POST');
    expect(eventData.creadoPor).toBe('editor@ajedrezvm.com');
    expect((formData.get('imagen') as File).name).toBe('portada.jpg');
    expect((formData.getAll('adjuntos')[0] as File).name).toBe('bases.pdf');
    request.flush({
      ...input,
      id: 1,
      slug: 'evento-multipart',
      imagenUrl: '/api/uploads/550e8400-e29b-41d4-a716-446655440000',
      views: 0,
      fuente: 'editor',
      creadoPor: 'editor@ajedrezvm.com',
      actualizadoEn: '2026-07-15T00:00:00.000Z',
    });
  });
});
