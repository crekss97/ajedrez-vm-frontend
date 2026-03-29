import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, tap } from 'rxjs';
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
  private readonly hasError = signal(false);

  protected readonly evento = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      switchMap((slug) =>
        this.eventosService.getEvento(slug).pipe(
          tap(() => {
            this.eventosService.registrarConsulta(slug).subscribe({
              error: () => undefined,
            });
          }),
          catchError(() => {
            this.hasError.set(true);
            return of(null as Evento | null);
          }),
        ),
      ),
    ),
    { initialValue: null as Evento | null },
  );

  protected readonly mostrarError = this.hasError.asReadonly();
}
