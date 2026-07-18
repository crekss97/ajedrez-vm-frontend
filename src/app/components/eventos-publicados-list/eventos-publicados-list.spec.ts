import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Evento } from '../../models/evento';
import { EventosPublicadosListComponent } from './eventos-publicados-list';

describe('EventosPublicadosListComponent', () => {
  let fixture: ComponentFixture<EventosPublicadosListComponent>;

  const evento: Evento = {
    id: 1,
    slug: 'vacaciones-vm',
    titulo: 'IRT Rápido Vacaciones VM',
    categoria: 'Torneo',
    descripcionCorta: 'Torneo rápido de vacaciones.',
    descripcionLarga: '<p>Información completa.</p>',
    fechaInicio: '2026-07-18T14:00:00.000Z',
    ubicacion: 'Biblioteca Municipal de Villa María',
    organizador: 'Ajedrez VM',
    imagenUrl: '/api/uploads/afiche',
    destacado: false,
    modalidad: 'Presencial',
    precio: '$15000',
    tags: [],
    views: 0,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventosPublicadosListComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(EventosPublicadosListComponent);
    fixture.componentRef.setInput('eventos', [evento]);
    fixture.detectChanges();
  });

  it('renderiza cada evento como un afiche enlazado al detalle', () => {
    const card = fixture.nativeElement.querySelector('.event-card') as HTMLAnchorElement;
    const image = card.querySelector('img') as HTMLImageElement;

    expect(fixture.nativeElement.querySelectorAll('.events-grid > li').length).toBe(1);
    expect(card.getAttribute('href')).toBe('/eventos/vacaciones-vm');
    expect(image.getAttribute('src')).toBe('/api/uploads/afiche');
    expect(image.getAttribute('alt')).toBe('');
    expect(image.getAttribute('loading')).toBe('lazy');
    expect(image.getAttribute('decoding')).toBe('async');
    expect(fixture.nativeElement.querySelector('.event-card__content')).toBeNull();
  });

  it('mantiene titulo, fecha, ubicacion y accion para tecnologias de asistencia', () => {
    const accessibleText = fixture.nativeElement.querySelector('.visually-hidden').textContent;

    expect(accessibleText).toContain('IRT Rápido Vacaciones VM');
    expect(accessibleText).toContain('Biblioteca Municipal de Villa María');
    expect(accessibleText).toContain('Ver detalle');
  });

  it('muestra un reemplazo visual cuando falla el afiche', () => {
    const image = fixture.nativeElement.querySelector('.event-card img') as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.event-card__fallback')?.textContent).toContain(
      'IRT Rápido Vacaciones VM',
    );
    expect(fixture.nativeElement.querySelector('.event-card img')).toBeNull();
  });

  it('vuelve a intentar la carga cuando cambia la URL del afiche', () => {
    const image = fixture.nativeElement.querySelector('.event-card img') as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    fixture.componentRef.setInput('eventos', [
      { ...evento, imagenUrl: '/api/uploads/afiche-actualizado' },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.event-card img')?.getAttribute('src')).toBe(
      '/api/uploads/afiche-actualizado',
    );
  });

  it('no anuncia un estado vacio mientras carga', () => {
    fixture.componentRef.setInput('eventos', []);
    fixture.componentRef.setInput('cargando', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Todavia no hay eventos publicados');
  });
});
