import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap, tap } from 'rxjs';
import { CompartirEvento } from '../../components/compartir-evento/compartir-evento';
import { EventosService } from '../../services/evento.service';
import { EventoMetadataService } from '../../services/evento-metadata.service';
import { RegistroVisitaService } from '../../services/registro-visita.service';
import { Evento } from '../../models/evento';

@Component({
  selector: 'app-evento-detalle',
  standalone: true,
  imports: [RouterLink, DatePipe, CompartirEvento],
  templateUrl: './evento-detalle.html',
  styleUrl: './evento-detalle.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventoDetalle {
  private readonly route = inject(ActivatedRoute);
  private readonly eventosService = inject(EventosService);
  private readonly metadata = inject(EventoMetadataService);
  private readonly registroVisita = inject(RegistroVisitaService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hasError = signal(false);
  private cancelarRegistroVisita: () => void = () => undefined;

  protected readonly evento = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('slug') ?? ''),
      tap(() => {
        this.cancelarRegistroVisita();
        this.cancelarRegistroVisita = () => undefined;
        this.hasError.set(false);
        this.metadata.restablecerDetalle();
      }),
      switchMap((slug) =>
        this.eventosService.getEvento(slug).pipe(
          tap((evento) => {
            this.metadata.actualizar(evento);
            try {
              this.cancelarRegistroVisita = this.registroVisita.programar(evento.slug);
            } catch {
              this.cancelarRegistroVisita = () => undefined;
            }
          }),
          catchError(() => {
            this.hasError.set(true);
            this.metadata.restablecerDetalle();
            return of(null as Evento | null);
          }),
          startWith(null as Evento | null),
        ),
      ),
    ),
    { initialValue: null as Evento | null },
  );

  protected readonly mostrarError = this.hasError.asReadonly();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.cancelarRegistroVisita();
      this.metadata.restablecerDetalle();
    });
  }

  protected abrirAfiche(dialog: HTMLDialogElement): void {
    if (!dialog.open) {
      dialog.showModal();
    }
  }

  protected cerrarAfiche(dialog: HTMLDialogElement): void {
    dialog.close();
  }

  protected cerrarAficheDesdeFondo(event: MouseEvent, dialog: HTMLDialogElement): void {
    const objetivo = event.target;
    if (
      objetivo instanceof Element
      && !objetivo.closest('.image-lightbox__content img')
      && !objetivo.closest('.image-lightbox__close')
    ) {
      dialog.close();
    }
  }
}
