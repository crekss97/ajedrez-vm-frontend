import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Evento } from '../../models/evento';

@Component({
  selector: 'app-entradas-populares',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './entradas-populares.html',
  styleUrl: './entradas-populares.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntradasPopularesComponent {
  readonly eventos = input.required<Evento[]>();
  readonly cargando = input(false);
  readonly mostrarError = input(false);
}
