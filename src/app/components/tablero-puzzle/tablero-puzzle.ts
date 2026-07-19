import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Chess, Color, PieceSymbol, Square } from 'chess.js';
import { PuzzleDiario } from '../../models/puzzle-diario';

interface CasillaPuzzle {
  coordenada: Square;
  pieza: string;
  nombrePieza: string;
  clara: boolean;
}

interface PromocionPendiente {
  desde: Square;
  hasta: Square;
}

interface OpcionPromocion {
  pieza: Exclude<PieceSymbol, 'p' | 'k'>;
  nombre: string;
}

const PIEZAS: Record<Color, Record<PieceSymbol, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' },
};

const NOMBRES_PIEZAS: Record<PieceSymbol, string> = {
  p: 'peon',
  n: 'caballo',
  b: 'alfil',
  r: 'torre',
  q: 'dama',
  k: 'rey',
};

const OPCIONES_PROMOCION: readonly OpcionPromocion[] = [
  { pieza: 'q', nombre: 'Dama' },
  { pieza: 'r', nombre: 'Torre' },
  { pieza: 'b', nombre: 'Alfil' },
  { pieza: 'n', nombre: 'Caballo' },
];

@Component({
  selector: 'app-tablero-puzzle',
  standalone: true,
  templateUrl: './tablero-puzzle.html',
  styleUrl: './tablero-puzzle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableroPuzzleComponent {
  readonly puzzle = input.required<PuzzleDiario>();
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly fenActual = signal('');
  private readonly indiceSolucion = signal(0);
  private readonly casillaSeleccionada = signal<Square | null>(null);
  private readonly ultimoMovimiento = signal<readonly Square[]>([]);
  protected readonly promocionPendiente = signal<PromocionPendiente | null>(null);
  private readonly indiceFoco = signal(0);
  private readonly temporizadores = new Set<ReturnType<typeof setTimeout>>();
  protected readonly respondiendo = signal(false);
  protected readonly completado = signal(false);
  protected readonly completadoAnteriormente = signal(false);
  protected readonly mensaje = signal('Elige la pieza que quieres mover.');
  protected readonly mensajeIncorrecto = signal(false);
  protected readonly posicionValida = signal(true);

  protected readonly opcionesPromocion = OPCIONES_PROMOCION;

  protected readonly orientacion = computed<Color>(() => {
    const partes = this.puzzle().fen.trim().split(/\s+/);
    return partes[1] === 'b' ? 'b' : 'w';
  });

  protected readonly turnoActual = computed<Color | null>(() => {
    try {
      return this.fenActual() ? new Chess(this.fenActual()).turn() : null;
    } catch {
      return null;
    }
  });

  protected readonly tableroBloqueado = computed(() =>
    this.respondiendo() || this.completado() || this.promocionPendiente() !== null,
  );

  protected readonly etiquetaTablero = computed(() => {
    const orientacion = this.orientacion() === 'w' ? 'las blancas' : 'las negras';
    let estado = this.turnoActual() === 'b' ? 'Turno de las negras.' : 'Turno de las blancas.';

    if (this.promocionPendiente()) {
      estado = 'Promocion pendiente.';
    } else if (this.respondiendo()) {
      estado = 'Respuesta del rival pendiente.';
    } else if (this.completado()) {
      estado = 'Puzzle completado.';
    }

    return `Tablero orientado desde ${orientacion}. ${estado}`;
  });

  protected readonly casillas = computed<CasillaPuzzle[]>(() => {
    if (!this.fenActual()) {
      return [];
    }

    const juego = new Chess(this.fenActual());
    const filas = this.orientacion() === 'w'
      ? ['8', '7', '6', '5', '4', '3', '2', '1']
      : ['1', '2', '3', '4', '5', '6', '7', '8'];
    const columnas = this.orientacion() === 'w'
      ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
      : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];

    return filas.flatMap((fila) => columnas.map((columna) => {
      const coordenada = `${columna}${fila}` as Square;
      const pieza = juego.get(coordenada);
      return {
        coordenada,
        pieza: pieza ? PIEZAS[pieza.color][pieza.type] : '',
        nombrePieza: pieza ? `${NOMBRES_PIEZAS[pieza.type]} ${pieza.color === 'w' ? 'blanco' : 'negro'}` : 'vacia',
        clara: (columna.charCodeAt(0) + Number(fila)) % 2 !== 0,
      };
    }));
  });

  protected readonly filasCasillas = computed(() => {
    const casillas = this.casillas();
    return Array.from({ length: 8 }, (_, indice) => casillas.slice(indice * 8, indice * 8 + 8));
  });

  constructor() {
    effect(() => {
      const puzzle = this.puzzle();
      untracked(() => this.inicializar(puzzle));
    });
    this.destroyRef.onDestroy(() => this.limpiarTemporizadores());
  }

  protected seleccionarCasilla(coordenada: Square): void {
    if (this.tableroBloqueado() || !this.posicionValida()) {
      return;
    }

    const juego = new Chess(this.fenActual());
    const seleccionada = this.casillaSeleccionada();
    const pieza = juego.get(coordenada);

    if (!seleccionada) {
      if (pieza?.color === juego.turn()) {
        this.casillaSeleccionada.set(coordenada);
        this.mensaje.set(`Seleccionaste ${coordenada}. Elige el destino.`);
        this.mensajeIncorrecto.set(false);
      }
      return;
    }

    if (coordenada === seleccionada) {
      this.casillaSeleccionada.set(null);
      this.mensaje.set('Seleccion cancelada. Elige una pieza.');
      return;
    }

    if (pieza?.color === juego.turn()) {
      this.casillaSeleccionada.set(coordenada);
      this.mensaje.set(`Seleccionaste ${coordenada}. Elige el destino.`);
      return;
    }

    const esperada = this.puzzle().solucion[this.indiceSolucion()]?.toLowerCase();
    const promocionesLegales = juego.moves({ square: seleccionada, verbose: true })
      .filter((movimiento) => movimiento.to === coordenada && movimiento.promotion);

    if (promocionesLegales.length) {
      this.promocionPendiente.set({ desde: seleccionada, hasta: coordenada });
      this.mensaje.set(`Elige la pieza para promocionar en ${coordenada}.`);
      this.mensajeIncorrecto.set(false);
      queueMicrotask(() => {
        if (this.promocionPendiente()) {
          this.elementRef.nativeElement.querySelector<HTMLElement>('.promotion-option')?.focus();
        }
      });
      return;
    }

    this.intentarMovimiento(`${seleccionada}${coordenada}`, esperada);
  }

  protected elegirPromocion(pieza: OpcionPromocion['pieza']): void {
    const pendiente = this.promocionPendiente();
    const esperada = this.puzzle().solucion[this.indiceSolucion()]?.toLowerCase();

    if (!pendiente) {
      return;
    }

    this.promocionPendiente.set(null);
    this.programarFocoCasilla(pendiente.desde);
    this.intentarMovimiento(`${pendiente.desde}${pendiente.hasta}${pieza}`, esperada);
  }

  protected moverFoco(event: KeyboardEvent, indice: number): void {
    const fila = Math.floor(indice / 8);
    const columna = indice % 8;
    let destino = indice;

    switch (event.key) {
      case 'ArrowLeft':
        destino = fila * 8 + Math.max(0, columna - 1);
        break;
      case 'ArrowRight':
        destino = fila * 8 + Math.min(7, columna + 1);
        break;
      case 'ArrowUp':
        destino = Math.max(0, indice - 8);
        break;
      case 'ArrowDown':
        destino = Math.min(63, indice + 8);
        break;
      case 'Home':
        destino = fila * 8;
        break;
      case 'End':
        destino = fila * 8 + 7;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.indiceFoco.set(destino);
    this.elementRef.nativeElement
      .querySelector<HTMLButtonElement>(`[data-board-index="${destino}"]`)
      ?.focus();
  }

  protected esFocoTabulable(indice: number): boolean {
    return this.indiceFoco() === indice;
  }

  private programarFocoCasilla(coordenada: Square): void {
    const indice = this.casillas().findIndex((casilla) => casilla.coordenada === coordenada);

    if (indice < 0) {
      return;
    }

    this.indiceFoco.set(indice);
    queueMicrotask(() => {
      this.elementRef.nativeElement
        .querySelector<HTMLButtonElement>(`[data-board-index="${indice}"]`)
        ?.focus();
    });
  }

  private intentarMovimiento(candidata: string, esperada: string | undefined): void {
    if (!esperada || candidata !== esperada) {
      this.casillaSeleccionada.set(null);
      this.mensaje.set('Esa no es la jugada. Intenta otra vez.');
      this.mensajeIncorrecto.set(true);
      return;
    }

    if (!this.aplicarMovimiento(candidata)) {
      return;
    }

    this.indiceSolucion.update((indice) => indice + 1);
    this.casillaSeleccionada.set(null);
    this.mensajeIncorrecto.set(false);

    if (this.indiceSolucion() >= this.puzzle().solucion.length) {
      this.finalizar();
      return;
    }

    this.respondiendo.set(true);
    this.mensaje.set('Buena jugada. El rival responde...');
    const demora = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
    const temporizador = setTimeout(() => {
      this.temporizadores.delete(temporizador);
      this.aplicarRespuestaRival();
    }, demora);
    this.temporizadores.add(temporizador);
  }

  protected estaSeleccionada(coordenada: Square): boolean {
    return this.casillaSeleccionada() === coordenada;
  }

  protected esUltimoMovimiento(coordenada: Square): boolean {
    return this.ultimoMovimiento().includes(coordenada);
  }

  protected reiniciar(): void {
    this.inicializar(this.puzzle(), false);
    this.mensaje.set('Puzzle reiniciado. Elige una pieza.');
  }

  private inicializar(puzzle: PuzzleDiario, consultarPersistencia = true): void {
    this.limpiarTemporizadores();
    try {
      const juego = new Chess(puzzle.fen);
      this.fenActual.set(juego.fen());
      this.posicionValida.set(true);
    } catch {
      this.fenActual.set('');
      this.posicionValida.set(false);
      this.mensaje.set('La posicion del puzzle no es valida.');
      return;
    }

    const movimiento = puzzle.ultimoMovimiento.toLowerCase();
    this.ultimoMovimiento.set(/^([a-h][1-8])([a-h][1-8])/.test(movimiento)
      ? [movimiento.slice(0, 2) as Square, movimiento.slice(2, 4) as Square]
      : []);
    this.indiceSolucion.set(0);
    this.casillaSeleccionada.set(null);
    this.promocionPendiente.set(null);
    this.indiceFoco.set(0);
    this.respondiendo.set(false);
    this.mensajeIncorrecto.set(false);
    if (consultarPersistencia) {
      this.completadoAnteriormente.set(this.leerFinalizacion(puzzle.id));
    }
    this.completado.set(consultarPersistencia && this.completadoAnteriormente());
    this.mensaje.set(this.completado()
      ? 'Ya completaste este puzzle diario.'
      : 'Elige la pieza que quieres mover.');
  }

  private aplicarRespuestaRival(): void {
    const respuesta = this.puzzle().solucion[this.indiceSolucion()]?.toLowerCase();
    const descripcion = respuesta ? this.describirMovimiento(respuesta) : '';
    if (!respuesta || !this.aplicarMovimiento(respuesta)) {
      this.respondiendo.set(false);
      return;
    }

    this.indiceSolucion.update((indice) => indice + 1);
    this.respondiendo.set(false);
    if (this.indiceSolucion() >= this.puzzle().solucion.length) {
      this.finalizar(`${descripcion} Puzzle completado. Excelente calculo.`);
    } else {
      this.mensaje.set(`${descripcion} Es tu turno. Encuentra la continuacion.`);
    }
  }

  private describirMovimiento(uci: string): string {
    const juego = new Chess(this.fenActual());
    const desde = uci.slice(0, 2) as Square;
    const hasta = uci.slice(2, 4) as Square;
    const pieza = juego.get(desde);
    const nombre = pieza
      ? `${NOMBRES_PIEZAS[pieza.type]} ${pieza.color === 'w' ? 'blanco' : 'negro'}`
      : 'pieza';
    const promocion = uci[4] ? ` y promociono a ${NOMBRES_PIEZAS[uci[4] as PieceSymbol]}` : '';
    return `El rival movio ${nombre} de ${desde} a ${hasta}${promocion}.`;
  }

  private aplicarMovimiento(uci: string): boolean {
    try {
      const juego = new Chess(this.fenActual());
      juego.move({
        from: uci.slice(0, 2) as Square,
        to: uci.slice(2, 4) as Square,
        promotion: (uci.slice(4, 5) || undefined) as PieceSymbol | undefined,
      });
      this.fenActual.set(juego.fen());
      this.ultimoMovimiento.set([uci.slice(0, 2) as Square, uci.slice(2, 4) as Square]);
      return true;
    } catch {
      this.mensaje.set('No se pudo reproducir la solucion del puzzle.');
      this.mensajeIncorrecto.set(true);
      this.respondiendo.set(false);
      return false;
    }
  }

  private finalizar(mensaje = 'Puzzle completado. Excelente calculo.'): void {
    this.completado.set(true);
    this.completadoAnteriormente.set(true);
    this.mensaje.set(mensaje);
    try {
      localStorage.setItem(this.clavePersistencia(this.puzzle().id), 'completado');
    } catch {
      // El almacenamiento es opcional; el puzzle sigue funcionando si el navegador lo bloquea.
    }
  }

  private leerFinalizacion(id: string): boolean {
    try {
      return localStorage.getItem(this.clavePersistencia(id)) === 'completado';
    } catch {
      return false;
    }
  }

  private clavePersistencia(id: string): string {
    return `ajedrez-vm:puzzle-diario:v1:${id}`;
  }

  private limpiarTemporizadores(): void {
    this.temporizadores.forEach((temporizador) => clearTimeout(temporizador));
    this.temporizadores.clear();
  }
}
