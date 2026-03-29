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
import { Evento } from '../../models/evento';
import { EventosService } from '../../services/evento.service';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  private readonly eventosService = inject(EventosService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hasError = signal(false);
  protected readonly activeSlideIndex = signal(0);

  protected readonly eventos = toSignal(
    this.eventosService.getEventos().pipe(
      catchError(() => {
        this.hasError.set(true);
        return of([] as Evento[]);
      }),
    ),
    { initialValue: [] as Evento[] },
  );

  protected readonly entradasPopulares = toSignal(
    this.eventosService.getEventosPopulares(5).pipe(
      catchError(() => {
        this.hasError.set(true);
        return of([] as Evento[]);
      }),
    ),
    { initialValue: [] as Evento[] },
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

  protected readonly otrosEventos = computed(() => {
    const principal = this.eventoPrincipal();

    return this.eventos().filter((evento) => evento.id !== principal?.id);
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

  protected readonly mostrarError = this.hasError.asReadonly();

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
