import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evento } from '../../models/evento';

@Component({
  selector: 'app-eventos-publicados-list',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './eventos-publicados-list.html',
  styleUrl: './eventos-publicados-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventosPublicadosListComponent {
  readonly eventos = input.required<Evento[]>();
  readonly cargando = input(false);
  readonly mostrarError = input(false);
  private readonly imagenesConError = signal<ReadonlySet<string>>(new Set());

  protected imagenConError(url: string): boolean {
    return this.imagenesConError().has(url);
  }

  protected marcarImagenConError(url: string): void {
    this.imagenesConError.update((urls) => new Set(urls).add(url));
  }
}
