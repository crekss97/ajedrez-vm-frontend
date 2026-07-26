import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OMITIR_CARGADOR_GLOBAL } from '../core/interceptors/app-loading.interceptor';
import { SolicitudPublicacion, SolicitudPublicacionInput } from '../models/solicitud-publicacion';
import { SolicitudesPublicacionService } from './solicitudes-publicacion.service';

describe('SolicitudesPublicacionService', () => {
  let service: SolicitudesPublicacionService;
  let httpTesting: HttpTestingController;

  const input: SolicitudPublicacionInput = {
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'ana@example.com',
    nombreTorneo: 'Abierto del Valle',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SolicitudesPublicacionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('envía la solicitud y sus dos archivos como multipart idempotente', () => {
    const image = new File(['imagen'], 'portada.webp', { type: 'image/webp' });
    const pdf = new File(['%PDF-1.7'], 'bases.pdf', { type: 'application/pdf' });
    let completed = false;

    service.createSolicitud(input, image, pdf).subscribe(() => completed = true);

    const request = httpTesting.expectOne((candidate) => candidate.url.endsWith('/solicitudes-publicacion'));
    const formData = request.request.body as FormData;
    const solicitudData = JSON.parse(String(formData.get('solicitud')));

    expect(request.request.method).toBe('POST');
    expect(request.request.context.get(OMITIR_CARGADOR_GLOBAL)).toBeTrue();
    expect(request.request.headers.get('Idempotency-Key')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(solicitudData).toEqual(input);
    expect((formData.get('imagen') as File).name).toBe('portada.webp');
    expect((formData.get('pdf') as File).name).toBe('bases.pdf');

    request.flush({
      message: 'Solicitud recibida.',
    });

    expect(completed).toBeTrue();
  });

  it('consulta la bandeja editorial y descarta medios que no sean uploads internos', () => {
    let solicitudes: SolicitudPublicacion[] = [];

    service.getSolicitudes().subscribe((response) => {
      solicitudes = response;
    });

    const request = httpTesting.expectOne((candidate) => candidate.url.endsWith('/editor/solicitudes-publicacion'));
    expect(request.request.method).toBe('GET');
    request.flush([{
      ...input,
      id: 7,
      createdAt: '2026-07-25T17:00:00.000Z',
      imagenUrl: '/api/editor/solicitudes-publicacion/7/archivos/imagen',
      pdfUrl: 'https://attacker.example/bases.pdf',
    }]);

    expect(solicitudes[0].creadoEn).toBe('2026-07-25T17:00:00.000Z');
    expect(solicitudes[0].imagenUrl).toContain('/api/editor/solicitudes-publicacion/7/archivos/imagen');
    expect(solicitudes[0].pdfUrl).toBe('');
  });

  it('lee un archivo editorial como blob sin activar el cargador global', () => {
    let file: Blob | undefined;

    service.getArchivo('/api/editor/solicitudes-publicacion/7/archivos/imagen').subscribe((response) => {
      file = response;
    });

    const request = httpTesting.expectOne('/api/editor/solicitudes-publicacion/7/archivos/imagen');
    expect(request.request.responseType).toBe('blob');
    expect(request.request.context.get(OMITIR_CARGADOR_GLOBAL)).toBeTrue();
    request.flush(new Blob(['imagen'], { type: 'image/jpeg' }));

    expect(file?.type).toBe('image/jpeg');
  });
});
