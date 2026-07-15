import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
  readonly mostrarError = input(false);
}
