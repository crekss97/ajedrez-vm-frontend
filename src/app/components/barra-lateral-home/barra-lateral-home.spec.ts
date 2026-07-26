import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PuzzleDiario } from '../../models/puzzle-diario';
import { BarraLateralHomeComponent } from './barra-lateral-home';

describe('BarraLateralHomeComponent', () => {
  let fixture: ComponentFixture<BarraLateralHomeComponent>;

  const puzzle: PuzzleDiario = {
    id: 'puzzle-1',
    fen: '8/8/8/8/8/8/4K3/6k1 w - - 0 1',
    ultimoMovimiento: 'g2g1',
    solucion: ['e2e3'],
    rating: 1200,
    temas: [],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BarraLateralHomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(BarraLateralHomeComponent);
    fixture.componentRef.setInput('links', [
      { id: '1', titulo: 'Federacion regional', url: 'https://example.com', createdAt: '' },
    ]);
    fixture.componentRef.setInput('puzzle', puzzle);
    fixture.detectChanges();
  });

  it('renderiza un solo aside con enlaces, convocatoria y puzzle en ese orden', () => {
    const aside = fixture.nativeElement.querySelectorAll('aside');
    const secciones = fixture.nativeElement.querySelectorAll('.home-sidebar__section');

    expect(aside.length).toBe(1);
    expect(aside[0].getAttribute('aria-label')).toBe('Contenido destacado');
    expect(secciones[0].textContent).toContain('Federacion regional');
    expect(secciones[1].classList).toContain('publication-cta');
    expect(secciones[1].textContent).toContain('Hagamos lugar a tu próximo evento');
    expect(secciones[1].querySelector('a')?.getAttribute('href')).toBe('/solicitar-publicacion');
    expect(secciones[2].textContent).toContain('Puzzle del dia');
    expect(fixture.nativeElement.textContent).not.toContain('Entradas populares');
    expect(fixture.nativeElement.textContent).not.toContain('visitas');
  });

  it('mantiene el puzzle cuando fallan los enlaces', () => {
    fixture.componentRef.setInput('links', []);
    fixture.componentRef.setInput('errorLinks', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar los accesos rapidos');
    expect(fixture.nativeElement.querySelector('.puzzle-board')).not.toBeNull();
  });

  it('mantiene los enlaces cuando falla el puzzle', () => {
    fixture.componentRef.setInput('puzzle', null);
    fixture.componentRef.setInput('errorPuzzle', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Federacion regional');
    expect(fixture.nativeElement.textContent).toContain('El puzzle no esta disponible');
  });

  it('muestra el puzzle aunque no haya enlaces', () => {
    fixture.componentRef.setInput('links', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('No hay enlaces destacados');
    expect(fixture.nativeElement.querySelector('.puzzle-board')).not.toBeNull();
  });
});
