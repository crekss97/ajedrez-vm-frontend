import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { SolicitudesPublicacionService } from '../../services/solicitudes-publicacion.service';
import { SolicitarPublicacion } from './solicitar-publicacion';

describe('SolicitarPublicacion', () => {
  let fixture: ComponentFixture<SolicitarPublicacion>;
  let service: jasmine.SpyObj<SolicitudesPublicacionService>;

  type FormShape = {
    setValue(value: {
      nombre: string;
      apellido: string;
      email: string;
      nombreTorneo: string;
      imagen: File | null;
      pdf: File | null;
    }): void;
    controls: {
      imagen: { value: File | null };
      pdf: { value: File | null };
    };
  };

  beforeEach(async () => {
    service = jasmine.createSpyObj<SolicitudesPublicacionService>('SolicitudesPublicacionService', [
      'createSolicitud',
    ]);
    await TestBed.configureTestingModule({
      imports: [SolicitarPublicacion],
      providers: [provideRouter([]), { provide: SolicitudesPublicacionService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(SolicitarPublicacion);
    fixture.detectChanges();
  });

  it('marca los campos obligatorios, anuncia el error y enfoca el primero', async () => {
    callSubmit();
    fixture.detectChanges();
    await fixture.whenStable();

    const firstInput = fixture.nativeElement.querySelector('#solicitud-nombre') as HTMLInputElement;
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Revisá');
    expect(firstInput.getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(firstInput);
    expect(service.createSolicitud).not.toHaveBeenCalled();
  });

  it('mantiene el formulario sin textos promocionales adicionales', () => {
    const content = fixture.nativeElement.textContent as string;

    expect(content).not.toContain('Para la cartelera');
    expect(content).not.toContain('Poné tu torneo en el mapa.');
    expect(content).not.toContain('Compartinos la información');
    expect(content).not.toContain('Tus datos');
    expect(content).not.toContain('La portada');
    expect(content).not.toContain('Las bases');
    expect(content).not.toContain('Tu próxima partida');
    expect(content).not.toContain('El envío no publica el torneo automáticamente.');
    expect(fixture.nativeElement.querySelector('.publication-intro')).toBeNull();
    expect(fixture.nativeElement.querySelector('.form-footer p')).toBeNull();
  });

  it('conserva los File cuando falla el POST y los libera al confirmar', () => {
    const image = new File(['imagen'], 'portada.jpg', { type: 'image/jpeg' });
    const pdf = new File(['%PDF-1.7'], 'bases.pdf', { type: 'application/pdf' });
    const form = getForm();
    form.setValue({
      nombre: 'Ana',
      apellido: 'Pérez',
      email: 'ana@example.com',
      nombreTorneo: 'Abierto del Valle',
      imagen: image,
      pdf,
    });
    service.createSolicitud.and.returnValue(throwError(() => new Error('fallo')));

    callSubmit();
    fixture.detectChanges();

    expect(form.controls.imagen.value).toBe(image);
    expect(form.controls.pdf.value).toBe(pdf);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('No se pudo enviar');

    service.createSolicitud.and.returnValue(of(undefined));
    callSubmit();
    fixture.detectChanges();

    expect(form.controls.imagen.value).toBeNull();
    expect(form.controls.pdf.value).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain('Recibimos');
  });

  it('rechaza un archivo con extensión PDF que no tiene firma PDF', async () => {
    const input = fixture.nativeElement.querySelector('#solicitud-pdf') as HTMLInputElement;
    const file = new File(['no es un pdf'], 'bases.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { configurable: true, value: [file] });

    await callSelectPdf(input);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#pdf-error')?.textContent).toContain('no parece ser un PDF');
    const form = getForm();
    expect(form.controls.pdf.value).toBeNull();
  });

  function callSubmit(): void {
    (fixture.componentInstance as unknown as { submitSolicitud: () => void }).submitSolicitud();
  }

  async function callSelectPdf(input: HTMLInputElement): Promise<void> {
    await (fixture.componentInstance as unknown as { selectPdf: (event: Event) => Promise<void> }).selectPdf({
      target: input,
    } as unknown as Event);
  }

  function getForm(): FormShape {
    return (fixture.componentInstance as unknown as { solicitudForm: FormShape }).solicitudForm;
  }
});
