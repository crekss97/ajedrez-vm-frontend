import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-cargador-ajedrez',
  standalone: true,
  templateUrl: './cargador-ajedrez.html',
  styleUrl: './cargador-ajedrez.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CargadorAjedrezComponent {
  readonly mensaje = input('Cargando');
  protected readonly casillas = Array.from({ length: 9 });
}
