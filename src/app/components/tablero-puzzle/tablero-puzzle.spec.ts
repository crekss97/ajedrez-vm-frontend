import { ComponentFixture, TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { PuzzleDiario } from '../../models/puzzle-diario';
import { TableroPuzzleComponent } from './tablero-puzzle';

describe('TableroPuzzleComponent', () => {
  let fixture: ComponentFixture<TableroPuzzleComponent>;

  const puzzle: PuzzleDiario = {
    id: 'puzzle-prueba',
    fen: '8/8/8/8/8/8/4K3/6k1 w - - 0 1',
    ultimoMovimiento: 'g2g1',
    solucion: ['e2e3', 'g1f1', 'e3f3'],
    rating: 1450,
    temas: ['endgame'],
  };

  beforeEach(async () => {
    localStorage.removeItem('ajedrez-vm:puzzle-diario:v1:puzzle-prueba');
    await TestBed.configureTestingModule({ imports: [TableroPuzzleComponent] }).compileComponents();
    fixture = TestBed.createComponent(TableroPuzzleComponent);
    fixture.componentRef.setInput('puzzle', puzzle);
    fixture.detectChanges();
  });

  afterEach(() => {
    for (const id of ['puzzle-prueba', 'puzzle-negras', 'puzzle-promocion', 'puzzle-nuevo']) {
      localStorage.removeItem(`ajedrez-vm:puzzle-diario:v1:${id}`);
    }
  });

  function casilla(coordenada: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`[aria-label^="${coordenada},"]`);
  }

  it('no modifica la posicion ante una jugada incorrecta y permite reintentar', () => {
    casilla('e2').click();
    casilla('d2').click();
    fixture.detectChanges();

    expect(casilla('e2').textContent).toContain('♔');
    expect(casilla('d2').textContent).not.toContain('♔');
    expect(fixture.nativeElement.textContent).toContain('Esa no es la jugada');

    casilla('e2').click();
    fixture.detectChanges();
    expect(casilla('e2').closest('[role="gridcell"]')?.getAttribute('aria-selected')).toBe('true');
  });

  it('aplica la jugada correcta y reproduce automaticamente la respuesta rival', fakeAsync(() => {
    casilla('e2').click();
    casilla('e3').click();
    fixture.detectChanges();

    expect(casilla('e3').textContent).toContain('♔');
    expect(casilla('g1').textContent).toContain('♚');
    expect(casilla('e3').getAttribute('aria-disabled')).toBe('true');

    tick(500);
    fixture.detectChanges();

    expect(casilla('f1').textContent).toContain('♚');
    expect(casilla('g1').textContent).not.toContain('♚');
    expect(casilla('e3').getAttribute('aria-disabled')).toBe('false');
    expect(fixture.nativeElement.querySelector('.puzzle-feedback').textContent).toContain(
      'El rival movio rey negro de g1 a f1. Es tu turno',
    );
  }));

  it('completa la variante y guarda solo la marca versionada por ID', fakeAsync(() => {
    casilla('e2').click();
    casilla('e3').click();
    tick(500);
    fixture.detectChanges();
    casilla('e3').click();
    casilla('f3').click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Puzzle completado');
    expect(localStorage.getItem('ajedrez-vm:puzzle-diario:v1:puzzle-prueba')).toBe('completado');
    expect(JSON.stringify(localStorage)).not.toContain('e2e3');
  }));

  it('muestra como completado un puzzle persistido y permite volver a resolverlo', () => {
    localStorage.setItem('ajedrez-vm:puzzle-diario:v1:puzzle-prueba', 'completado');
    const nuevaFixture = TestBed.createComponent(TableroPuzzleComponent);
    nuevaFixture.componentRef.setInput('puzzle', puzzle);
    nuevaFixture.detectChanges();

    expect(nuevaFixture.nativeElement.textContent).toContain('Ya completaste este puzzle diario');
    (nuevaFixture.nativeElement.querySelector('.puzzle-reset') as HTMLButtonElement).click();
    nuevaFixture.detectChanges();

    expect(nuevaFixture.nativeElement.textContent).toContain('Puzzle reiniciado');
    expect(
      (nuevaFixture.nativeElement.querySelector('.puzzle-square') as HTMLButtonElement).getAttribute(
        'aria-disabled',
      ),
    ).toBe('false');
    expect(localStorage.getItem('ajedrez-vm:puzzle-diario:v1:puzzle-prueba')).toBe('completado');
    nuevaFixture.destroy();
  });

  it('orienta el tablero desde el lado inicial y permite resolver jugando con negras', () => {
    fixture.componentRef.setInput('puzzle', {
      ...puzzle,
      id: 'puzzle-negras',
      fen: '8/8/8/8/8/4k3/8/6K1 b - - 0 1',
      ultimoMovimiento: '',
      solucion: ['e3e4'],
    });
    fixture.detectChanges();

    const primera = fixture.nativeElement.querySelector('.puzzle-square') as HTMLButtonElement;
    expect(primera.getAttribute('aria-label')).toContain('h1');
    expect(fixture.nativeElement.querySelector('.puzzle-board').getAttribute('aria-label')).toBe(
      'Tablero orientado desde las negras. Turno de las negras.',
    );

    casilla('e3').click();
    casilla('e4').click();
    fixture.detectChanges();

    expect(casilla('e4').textContent).toContain('♚');
    expect(fixture.nativeElement.textContent).toContain('Puzzle completado');
  });

  it('usa un grid con filas, un solo tab stop y navegacion con flechas, Home y End', () => {
    const tablero = fixture.nativeElement.querySelector('.puzzle-board') as HTMLElement;
    const botones = () => Array.from(
      fixture.nativeElement.querySelectorAll('.puzzle-square') as NodeListOf<HTMLButtonElement>,
    );

    expect(tablero.querySelectorAll(':scope > [role="row"]').length).toBe(8);
    expect(tablero.querySelectorAll('[role="gridcell"]').length).toBe(64);
    expect(botones().filter((boton) => boton.tabIndex === 0).length).toBe(1);

    const primera = botones()[0];
    primera.focus();
    primera.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(botones()[1]);

    botones()[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(botones()[7]);

    botones()[7].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(botones()[15]);

    botones()[15].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(document.activeElement).toBe(botones()[8]);
    expect(botones().filter((boton) => boton.tabIndex === 0)).toEqual([botones()[8]]);
  });

  it('solicita la promocion y valida una subpromocion sin inferirla de la solucion', fakeAsync(() => {
    fixture.componentRef.setInput('puzzle', {
      ...puzzle,
      id: 'puzzle-promocion',
      fen: '8/P7/8/8/8/8/7k/4K3 w - - 0 1',
      ultimoMovimiento: '',
      solucion: ['a7a8n'],
    });
    fixture.detectChanges();

    casilla('a7').click();
    casilla('a8').click();
    fixture.detectChanges();
    flushMicrotasks();

    const opciones = Array.from(
      fixture.nativeElement.querySelectorAll('.promotion-option') as NodeListOf<HTMLButtonElement>,
    );
    expect(opciones.map((opcion) => opcion.textContent?.trim())).toEqual([
      'Dama',
      'Torre',
      'Alfil',
      'Caballo',
    ]);
    expect(casilla('a7').getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(opciones[0]);

    opciones[0].click();
    fixture.detectChanges();
    flushMicrotasks();
    expect(fixture.nativeElement.textContent).toContain('Esa no es la jugada');
    expect(casilla('a7').textContent).toContain('♙');
    expect(document.activeElement).toBe(casilla('a7'));

    casilla('a7').click();
    casilla('a8').click();
    fixture.detectChanges();
    flushMicrotasks();
    const caballo = Array.from(
      fixture.nativeElement.querySelectorAll('.promotion-option') as NodeListOf<HTMLButtonElement>,
    ).find((opcion) => opcion.textContent?.trim() === 'Caballo');
    caballo?.click();
    fixture.detectChanges();
    flushMicrotasks();

    expect(casilla('a8').textContent).toContain('♘');
    expect(fixture.nativeElement.textContent).toContain('Puzzle completado');
    expect(document.activeElement).toBe(casilla('a7'));
  }));

  it('cancela la respuesta pendiente al reiniciar', fakeAsync(() => {
    fixture.componentRef.setInput('puzzle', {
      ...puzzle,
      solucion: ['e2e3', 'g1f1'],
    });
    fixture.detectChanges();
    casilla('e2').click();
    casilla('e3').click();

    (fixture.componentInstance as unknown as { reiniciar(): void }).reiniciar();
    tick(500);
    fixture.detectChanges();

    expect(casilla('e2').textContent).toContain('♔');
    expect(casilla('g1').textContent).toContain('♚');
    expect(fixture.nativeElement.textContent).toContain('Puzzle reiniciado');
  }));

  it('cancela la respuesta pendiente al cambiar de puzzle', fakeAsync(() => {
    fixture.componentRef.setInput('puzzle', { ...puzzle, solucion: ['e2e3', 'g1f1'] });
    fixture.detectChanges();
    casilla('e2').click();
    casilla('e3').click();

    fixture.componentRef.setInput('puzzle', {
      ...puzzle,
      id: 'puzzle-nuevo',
      fen: '8/8/8/8/8/4k3/8/6K1 b - - 0 1',
      ultimoMovimiento: '',
      solucion: ['e3e4'],
    });
    fixture.detectChanges();
    tick(500);
    fixture.detectChanges();

    expect(casilla('e3').textContent).toContain('♚');
    expect(casilla('f1').textContent).not.toContain('♚');
  }));

  it('cancela la respuesta pendiente al destruirse', fakeAsync(() => {
    fixture.componentRef.setInput('puzzle', { ...puzzle, solucion: ['e2e3', 'g1f1'] });
    fixture.detectChanges();
    casilla('e2').click();
    casilla('e3').click();

    fixture.destroy();
    tick(500);

    expect(localStorage.getItem('ajedrez-vm:puzzle-diario:v1:puzzle-prueba')).toBeNull();
  }));

  it('funciona cuando localStorage esta bloqueado', () => {
    spyOn(Storage.prototype, 'getItem').and.throwError('Bloqueado');
    spyOn(Storage.prototype, 'setItem').and.throwError('Bloqueado');
    const nuevaFixture = TestBed.createComponent(TableroPuzzleComponent);
    nuevaFixture.componentRef.setInput('puzzle', { ...puzzle, solucion: ['e2e3'] });
    nuevaFixture.detectChanges();

    const obtener = (coordenada: string) => nuevaFixture.nativeElement.querySelector(
      `[aria-label^="${coordenada},"]`,
    ) as HTMLButtonElement;
    obtener('e2').click();
    obtener('e3').click();
    nuevaFixture.detectChanges();

    expect(nuevaFixture.nativeElement.textContent).toContain('Puzzle completado');
    nuevaFixture.destroy();
  });
});
