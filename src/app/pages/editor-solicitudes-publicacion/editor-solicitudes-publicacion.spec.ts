import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SolicitudPublicacion } from '../../models/solicitud-publicacion';
import { SolicitudesPublicacionService } from '../../services/solicitudes-publicacion.service';
import { EditorSolicitudesPublicacion } from './editor-solicitudes-publicacion';

describe('EditorSolicitudesPublicacion', () => {
  let fixture: ComponentFixture<EditorSolicitudesPublicacion>;
  let service: jasmine.SpyObj<SolicitudesPublicacionService>;

  const solicitud: SolicitudPublicacion = {
    id: 9,
    nombre: 'Ana',
    apellido: 'Pérez',
    email: 'ana@example.com',
    nombreTorneo: 'Abierto del Valle',
    creadoEn: '2026-07-25T18:00:00.000Z',
    imagenUrl: '/api/editor/solicitudes-publicacion/9/archivos/imagen',
    pdfUrl: '/api/editor/solicitudes-publicacion/9/archivos/pdf',
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<SolicitudesPublicacionService>('SolicitudesPublicacionService', [
      'getSolicitudes',
      'getArchivo',
    ]);
    service.getSolicitudes.and.returnValue(of([solicitud]));
    service.getArchivo.and.returnValue(of(new Blob(['imagen'], { type: 'image/jpeg' })));
    await TestBed.configureTestingModule({
      imports: [EditorSolicitudesPublicacion],
      providers: [provideRouter([]), { provide: SolicitudesPublicacionService, useValue: service }],
    }).compileComponents();
  });

  it('muestra los datos, la portada descargable y el enlace al PDF sin estados editoriales', () => {
    fixture = TestBed.createComponent(EditorSolicitudesPublicacion);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    const image = fixture.nativeElement.querySelector('.request-card__image img') as HTMLImageElement;
    const imageButton = fixture.nativeElement.querySelector('.request-card__image-button') as HTMLButtonElement;
    const download = fixture.nativeElement.querySelector('.request-action--primary') as HTMLButtonElement;
    const pdf = fixture.nativeElement.querySelector('.request-action--pdf') as HTMLAnchorElement;

    expect(service.getSolicitudes).toHaveBeenCalledOnceWith();
    expect(content).toContain('Ana Pérez');
    expect(content).toContain('ana@example.com');
    expect(content).toContain('Abierto del Valle');
    expect(content).not.toContain('Entrada editorial');
    expect(content).not.toContain('Datos y materiales enviados');
    expect(content).not.toContain('Publicado');
    expect(content).not.toContain('Borrador');
    expect(image.alt).toBe('Portada de Abierto del Valle');
    expect(image.src).toContain('blob:');
    expect(imageButton).not.toBeNull();
    expect(download).not.toBeNull();
    expect(service.getArchivo).toHaveBeenCalledWith(solicitud.imagenUrl);
    expect(pdf.href).toContain('/api/editor/solicitudes-publicacion/9/archivos/pdf');
    expect(pdf.target).toBe('_blank');
  });

  it('anuncia un error de carga y permite reintentar', () => {
    service.getSolicitudes.and.returnValue(throwError(() => new Error('fallo')));
    fixture = TestBed.createComponent(EditorSolicitudesPublicacion);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'No se pudieron cargar las solicitudes',
    );
    expect(fixture.nativeElement.querySelector('button')?.textContent).toContain('Reintentar');
  });
});
