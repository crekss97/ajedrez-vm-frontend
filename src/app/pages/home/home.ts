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
import { EntradasPopularesComponent } from '../../components/entradas-populares/entradas-populares';
import { EventosPublicadosListComponent } from '../../components/eventos-publicados-list/eventos-publicados-list';
import { LinksDestacadosComponent } from '../../components/links-destacados/links-destacados';
import { Evento } from '../../models/evento';
import { SidebarLink } from '../../models/sidebar-link';
import { EventosService } from '../../services/evento.service';
import { SidebarLinksService } from '../../services/sidebar-links.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    DatePipe,
    EventosPublicadosListComponent,
    EntradasPopularesComponent,
    LinksDestacadosComponent,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly eventosService = inject(EventosService);
  private readonly sidebarLinksService = inject(SidebarLinksService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly activeSlideIndex = signal(0);
  private readonly errorEventos = signal(false);
  private readonly errorLinks = signal(false);

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

  protected readonly eventos = computed(() => this.eventosCargados() ?? []);
  protected readonly linksDestacados = computed(() => this.linksCargados() ?? []);
  protected readonly cargandoEventos = computed(() => this.eventosCargados() === undefined);
  protected readonly cargandoLinks = computed(() => this.linksCargados() === undefined);
  protected readonly mostrarErrorEventos = this.errorEventos.asReadonly();
  protected readonly mostrarErrorLinks = this.errorLinks.asReadonly();

  protected readonly entradasPopulares = computed(() =>
    [...this.eventos()].sort((a, b) => b.views - a.views).slice(0, 5),
  );

  protected readonly eventosDestacados = computed(() => {
    const destacados = this.eventos().filter((evento) => evento.destacado);
    return destacados.length ? destacados : this.eventos().slice(0, 1);
  });

  protected readonly eventoPrincipal = computed(() => {
    const destacados = this.eventosDestacados();

    if (!destacados.length) {
      return null;
    }

    const normalizedIndex = this.activeSlideIndex() % destacados.length;
    return destacados[normalizedIndex] ?? destacados[0];
  });

  protected readonly totalSlides = computed(() => this.eventosDestacados().length);

  constructor() {
    const intervalId = window.setInterval(() => {
      this.advanceSlide();
    }, 6000);

    this.destroyRef.onDestroy(() => {
      window.clearInterval(intervalId);
    });
  }

  protected goToSlide(index: number): void {
    const total = this.totalSlides();

    if (!total) {
      return;
    }

    const normalizedIndex = ((index % total) + total) % total;
    this.activeSlideIndex.set(normalizedIndex);
  }

  protected showPreviousSlide(): void {
    this.goToSlide(this.activeSlideIndex() - 1);
  }

  protected showNextSlide(): void {
    this.goToSlide(this.activeSlideIndex() + 1);
  }

  private advanceSlide(): void {
    if (this.totalSlides() <= 1) {
      this.activeSlideIndex.set(0);
      return;
    }

    this.showNextSlide();
  }
}
