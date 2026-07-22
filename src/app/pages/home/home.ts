import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { BarraLateralHomeComponent } from '../../components/barra-lateral-home/barra-lateral-home';
import { EventosPublicadosListComponent } from '../../components/eventos-publicados-list/eventos-publicados-list';
import { Evento } from '../../models/evento';
import { PuzzleDiario } from '../../models/puzzle-diario';
import { SidebarLink } from '../../models/sidebar-link';
import { EventosService } from '../../services/evento.service';
import { PuzzleDiarioService } from '../../services/puzzle-diario.service';
import { SidebarLinksService } from '../../services/sidebar-links.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    EventosPublicadosListComponent,
    BarraLateralHomeComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly eventosService = inject(EventosService);
  private readonly sidebarLinksService = inject(SidebarLinksService);
  private readonly puzzleDiarioService = inject(PuzzleDiarioService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly activeSlideIndex = signal(0);
  protected readonly parallaxX = signal(0);
  protected readonly parallaxY = signal(0);
  private readonly errorEventos = signal(false);
  private readonly errorLinks = signal(false);
  private readonly errorPuzzle = signal(false);
  private readonly imagenesDestacadasConError = signal<ReadonlySet<string>>(new Set());
  private parallaxFrameId: number | null = null;
  private pendingParallax = { x: 0, y: 0 };

  private readonly eventosCargados = toSignal(
    this.eventosService.getEventos().pipe(
      catchError(() => {
        this.errorEventos.set(true);
        return of([] as Evento[]);
      }),
    ),
  );

  private readonly linksCargados = toSignal(
    this.sidebarLinksService.getLinks().pipe(
      catchError(() => {
        this.errorLinks.set(true);
        return of([] as SidebarLink[]);
      }),
    ),
  );

  private readonly puzzleCargado = toSignal(
    this.puzzleDiarioService.getPuzzleDiario().pipe(
      catchError(() => {
        this.errorPuzzle.set(true);
        return of(null as PuzzleDiario | null);
      }),
    ),
  );

  protected readonly eventos = computed(() => this.eventosCargados() ?? []);
  protected readonly linksDestacados = computed(() => this.linksCargados() ?? []);
  protected readonly puzzleDiario = computed(() => this.puzzleCargado() ?? null);
  protected readonly cargandoEventos = computed(() => this.eventosCargados() === undefined);
  protected readonly cargandoLinks = computed(() => this.linksCargados() === undefined);
  protected readonly cargandoPuzzle = computed(() => this.puzzleCargado() === undefined);
  protected readonly mostrarErrorEventos = this.errorEventos.asReadonly();
  protected readonly mostrarErrorLinks = this.errorLinks.asReadonly();
  protected readonly mostrarErrorPuzzle = this.errorPuzzle.asReadonly();

  protected readonly eventosDestacados = computed(() => {
    return this.eventos().filter((evento) => evento.destacado === true);
  });

  protected readonly activeSlideIndexNormalized = computed(() => {
    const total = this.eventosDestacados().length;
    return total ? ((this.activeSlideIndex() % total) + total) % total : 0;
  });

  protected readonly eventoPrincipal = computed(() => {
    const destacados = this.eventosDestacados();

    if (!destacados.length) {
      return null;
    }

    return destacados[this.activeSlideIndexNormalized()] ?? destacados[0];
  });

  protected readonly totalSlides = computed(() => this.eventosDestacados().length);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.parallaxFrameId !== null) {
        window.cancelAnimationFrame(this.parallaxFrameId);
      }
    });
  }

  protected goToSlide(index: number): void {
    const total = this.totalSlides();

    if (!total) {
      return;
    }

    this.activeSlideIndex.set(((index % total) + total) % total);
  }

  protected showPreviousSlide(): void {
    this.goToSlide(this.activeSlideIndexNormalized() - 1);
  }

  protected showNextSlide(): void {
    this.goToSlide(this.activeSlideIndexNormalized() + 1);
  }

  protected updateParallax(event: PointerEvent): void {
    if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.pendingParallax = {
      x: ((event.clientX - bounds.left) / bounds.width - 0.5) * 16,
      y: ((event.clientY - bounds.top) / bounds.height - 0.5) * 12,
    };

    if (this.parallaxFrameId !== null) {
      return;
    }

    this.parallaxFrameId = window.requestAnimationFrame(() => {
      this.parallaxX.set(this.pendingParallax.x);
      this.parallaxY.set(this.pendingParallax.y);
      this.parallaxFrameId = null;
    });
  }

  protected resetParallax(): void {
    if (this.parallaxFrameId !== null) {
      window.cancelAnimationFrame(this.parallaxFrameId);
      this.parallaxFrameId = null;
    }

    this.parallaxX.set(0);
    this.parallaxY.set(0);
  }

  protected imagenDestacadaConError(url: string): boolean {
    return this.imagenesDestacadasConError().has(url);
  }

  protected marcarImagenDestacadaConError(url: string): void {
    this.imagenesDestacadasConError.update((urls) => new Set(urls).add(url));
  }

}
