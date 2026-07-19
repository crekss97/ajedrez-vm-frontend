import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, EMPTY, map, of, startWith, switchMap, tap } from 'rxjs';
import { EventosService } from '../../services/evento.service';
import { Evento } from '../../models/evento';

@Component({
  selector: 'app-evento-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './evento-detalle.html',
  styleUrl: './evento-detalle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventoDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly eventosService = inject(EventosService);
  private readonly title = inject(Title);
  private readonly hasError = signal(false);
  private readonly tituloSeguro = 'Detalle del evento | Ajedrez VM';

  protected readonly evento = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      tap(() => {
        this.hasError.set(false);
        this.title.setTitle(this.tituloSeguro);
      }),
      switchMap((slug) =>
        this.eventosService.getEvento(slug).pipe(
          tap((evento) => {
            this.title.setTitle(`${evento.titulo} | Ajedrez VM`);
            this.eventosService
              .registrarConsulta(slug)
              .pipe(catchError(() => EMPTY))
              .subscribe();
          }),
          catchError(() => {
            this.hasError.set(true);
            this.title.setTitle(this.tituloSeguro);
            return of(null as Evento | null);
          }),
          startWith(null as Evento | null),
        ),
      ),
    ),
    { initialValue: null as Evento | null },
  );

  protected readonly mostrarError = this.hasError.asReadonly();
}
